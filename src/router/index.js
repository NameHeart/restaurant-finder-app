import Vue from "vue";
import Router from "vue-router";
import Restaurant from "@/pages/Restaurant";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      component: Restaurant
    }
  ]
});
