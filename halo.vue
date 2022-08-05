
<template>
  <div class="tmp-container">
    <h1>{{ str }}{{ speak }}</h1>
    <child :name="childName"></child>
  </div>
</template>

<script>
export default {
  customizeComponents: {
    child: "./child.vue",
  },
  customizeMixins: ["./mixins.js"],
  customizeServices: ["./service.js"],
  customizeScripts: ["./lib.js"],
  props: {
    speak: {
      default: "SOMETHING",
      type: String,
    },
  },
  data() {
    return {
      str: "HALO",
      childName: "CHILD",
    };
  },
  mounted() {
    this.services.getData().then((res) => {
      this.str += " " + res.msg;
      lib.action();
    });
  },
};
</script>

<style>
.tmp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>