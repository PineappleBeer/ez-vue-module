
export default {
  mounted() {
    setTimeout(() => {
      document.querySelector('h1').innerHTML += ' IT WORKS';
    }, 2000);
  }
}