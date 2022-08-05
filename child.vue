
<template>
  <p>{{ name }} {{ word }}</p>
</template>

<script>
export default {
  props: {
    name: {
      default: "NAME",
      type: String,
    },
  },
  data() {
    return {
      word: "COMPONENT",
    };
  },
};
</script>

<style>
</style>