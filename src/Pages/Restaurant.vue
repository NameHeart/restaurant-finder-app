<template>
  <div>
    <!-- ส่วนที่เกี่ยวกับค้นหาตำแหน่ง -->
    <section  style="position:relative;z-index:1">
      <div class="column draggable-column" style="position: absolute;  left: 40%; transform: translate(-20%);">
    <form class="container mt-5">
      <div class="container mt-5">
        <div class="row">
          <div>
            <h2>Find a restaurant</h2>
          </div>
        </div>
      </div>
      <div class="container" v-show="error">{{error}}</div>
      <div class="container">
        <div class="field">
          <div class="input-group input-group-lg" :class="{loading:spinner}">
            <!-- ปุ่มเรียกใช้งาน getCurrentPosition -->
            <span class="input-group-text" id="inputGroup-sizing-lg" @click="locatorButtonPressed"><i class="bi bi-geo-alt"></i></span>
            <!-- ช่องกรอกที่อยู่ -->
            <input
              type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-lg"
              placeholder="Enter your address"
              v-model="address"
              ref="autocomplete"
              @input="onAddressInput"
            />
          </div>
        </div>
        <div style="padding-top: 20px;">
          <!-- ปุ่มค้นหาร้านอาหาร -->
          <button type="button" class="btn btn-success" style="width: 100px;">Go</button>
          <!-- ปุ่มแสดงรายชื่อร้าน -->
          <button type="button" class="btn btn-info" @click="toggleRestaurantList">Show Restaurant Names</button>
        </div>
      </div>
    </form>
  </div>
</section>

    <!-- ส่วนที่เกี่ยวกับการแสดงรายชื่อร้านอาหาร -->
    <div class="drawer" :style="{ right: showRestaurantNames ? '0' : '-500px' }">
      <button @click="toggleRestaurantList" class="btn btn-outline-danger" style="position: absolute; top: 10px; left: 10px;">Close</button>
      <div class="drawer-content" style="padding-top: 20px; max-height: 90vh; overflow-y: scroll;">
        <!-- หัวข้อรายชื่อร้าน -->
        <h2 style="font-size: 24px;">Restaurant List</h2>
        <ul>
          <!-- วนลูปแสดงรายชื่อร้าน -->
          <div v-for="restaurant in restaurants" :key="restaurant.place_id" style="padding-top: 20px;">
            <!-- ลิงก์ไปยัง Google Maps สำหรับแสดงตำแหน่งร้าน -->
            <a :href="getGoogleMapLink(restaurant.place_id)" target="_blank" class="black-text">{{ restaurant.name }}</a>
            <!-- เพิ่มเส้นคั่นระหว่างรายชื่อ -->
            <hr style="margin: 10px 0;">
          </div>
        </ul>
      </div>
    </div>

    <!-- แผนที่ -->
    <section id="map" ref="map"></section>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      address: "",
      error: "",
      spinner: false,
      restaurants: [],
      markers: [],
      showRestaurantNames: false,
    };
  },

  mounted() {
    const column = this.$el.querySelector('.draggable-column');
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    column.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = column.getBoundingClientRect();
      offset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;
      column.style.left = `${x}px`;
      column.style.top = `${y}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    // สร้างรายการสถานที่ค้างอยู่ในช่อง input
    var autocomplete = new google.maps.places.Autocomplete(
      this.$refs["autocomplete"],
      {
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(45.4215296, -75.6971931)
        ),
      }
    );

    // รอการเลือกสถานที่
    autocomplete.addListener("place_changed", () => {
      var place = autocomplete.getPlace();

      // แสดงตำแหน่งที่เลือกบนแผนที่
      this.showLocationOnTheMap(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );

      // อัปเดตค่า address ใน data เมื่อมีการเลือกสถานที่
      this.address = place.formatted_address;
    });
  },

  methods: {
    onAddressInput(event) {
      this.address = event.target.value;
    },
    // ฟังก์ชันเมื่อกดปุ่ม Locate
    locatorButtonPressed() {
      this.spinner = true;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // ดึงข้อมูลที่อยู่จากพิกัด
            this.getAddressFrom(
              position.coords.latitude,
              position.coords.longitude
            );

            // แสดงตำแหน่งที่เลือกบนแผนที่
            this.showLocationOnTheMap(
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error) => {
            this.error =
              "Locator is unable to find your address. Please type your address manually.";
            this.spinner = false;
          }
        );
      } else {
        this.error = "Your browser does not support geolocation API ";
        this.spinner = false;
      }
    },

    // ฟังก์ชันเรียกใช้ API หาข้อมูลที่อยู่จากพิกัด
    getAddressFrom(lat, long) {
      axios
        .get(
          "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
            lat +
            "," +
            long +
            "&key=AIzaSyBOzEkYBvxD58pzam0x0b9ORjis4iUVqng"
        )
        .then((response) => {
          if (response.data.error_message) {
            this.error = response.data.error_message;
            console.log(response.data.error_message);
          } else {
            this.address = response.data.results[0].formatted_address;
            // เรียกฟังก์ชันค้นหาร้านอาหารในบริเวณที่กำหนด
            this.searchRestaurantsNearby(lat, long);
          }
          this.spinner = false;
        })
        .catch((error) => {
          this.error = error.message;
          this.spinner = false;
          console.log(error.message);
        });
    },

    // ฟังก์ชันแสดงรายชื่อร้านอาหารใน Console
    showRestaurantNamesInConsole() {
      for (var i = 0; i < this.restaurants.length; i++) {
        var restaurant = this.restaurants[i];
        console.log(restaurant.name);
      }
    },

    // ฟังก์ชันสลับการแสดงรายชื่อร้านอาหาร
    toggleRestaurantList() {
    this.showRestaurantNames = !this.showRestaurantNames; // เปลี่ยนชื่อตัวแปรที่ใช้ในการเปิด/ปิด drawer
  },

    // ฟังก์ชันแสดงตำแหน่งบนแผนที่
    showLocationOnTheMap(latitude, longitude) {
      var map = new google.maps.Map(this.$refs["map"], {
        zoom: 15,
        center: new google.maps.LatLng(latitude, longitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: map,
      });

      // เรียกใช้งานการค้นหาร้านอาหารใกล้เคียง
      this.searchRestaurantsNearby(latitude, longitude);
    },

    // ฟังก์ชันค้นหาร้านอาหารใกล้เคียง
    searchRestaurantsNearby(latitude, longitude) {
      var map = new google.maps.Map(this.$refs["map"], {
        zoom: 15,
        center: new google.maps.LatLng(latitude, longitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      var service = new google.maps.places.PlacesService(map);

      var request = {
        location: new google.maps.LatLng(latitude, longitude),
        radius: 1000,
        type: 'restaurant',
      };

      // ก่อนที่จะเริ่มค้นหาใหม่ เราจะลบร้านอาหารเก่าออกจากแผนที่
      this.clearMarkers();

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          this.restaurants = results;
          this.clearMarkers();
          for (var i = 0; i < results.length; i++) {
            var place = results[i];
            this.createRestaurantMarker(map, place);
          }
        }
      });
    },

    // ฟังก์ชันลบมาร์คเกอร์ทั้งหมดบนแผนที่
    clearMarkers() {
      for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
      }
      this.markers = [];
    },

    // ฟังก์ชันสร้างมาร์คเกอร์สำหรับร้านอาหาร
    createRestaurantMarker(map, place) {
  var marker = new google.maps.Marker({
    position: place.geometry.location,
    map: map,
    title: place.name,
  });

  var isOpen = place.opening_hours && place.opening_hours.open_now;
  var status = isOpen ? "Open" : "Closed";

  var infoWindowContent = `
    <div style="position:relative;z-index:1000;"> <!-- เปลี่ยนค่า z-index เป็นค่าที่ต้องการ -->
      <strong>${place.name}</strong><br>
      ${place.vicinity}<br>
      Status: ${status}<br>
      ${place.photos ? `<img src="${place.photos[0].getUrl({ maxWidth: 100 })}"><br>` : ''}
      <a href="${this.getGoogleMapLink(place.place_id)}" target="_blank">View on Google Maps</a>
    </div>
  `;

  var infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent,
  });

  marker.infoWindow = infoWindow;

  marker.addListener('click', () => {
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    infoWindow.open(map, marker);
    this.currentInfoWindow = infoWindow;
  });

  this.markers.push(marker);
},

    // ฟังก์ชันสร้างลิงก์ไปยัง Google Maps
    getGoogleMapLink(placeId) {
      return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    },
  },
};
</script>


  <style>
  .ui.button,
  .dot.circle.icon {
    background-color: #ff5a5f;
    color: white;
  }

  .pac-icon {
    display: none;
  }

  .pac-item {
    padding: 10px;
    font-size: 16px;
    cursor: pointer;
  }

  .pac-item:hover {
    background-color: #ececec;
  }

  .pac-item-query {
    font-size: 16px;
  }

  #map {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
  .black-text {
    color: black;
    text-decoration: none;
    font-size: 18px;
  }
  .container{
    background: #ececec;
  }
  .drawer {
    position: fixed;
    top: 0;
    right: -400px; /* ปิด Drawer โดยค่าเริ่มต้น */
    width: 500px; /* ปรับขนาดกว้างของ Drawer */
    height: 100%;
    background-color: #ffffff;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
    transition: right 0.3s ease;
    z-index: 2;
  }

  /* ... ส่วน CSS อื่น ๆ ... */

  /* สไตล์ขีดเส้น */
  hr {
    border-top: 1px solid #ccc;
    margin: 10px 0;
  }

  .container {
  max-width: 500px; /* กำหนดความกว้างสูงสุดของ container เป็น 300px */
}


.draggable-column {
  position: absolute;
  background-color: lightblue;
  width: 450px;
  height: 200px;
  cursor: grab;
}


  </style>



