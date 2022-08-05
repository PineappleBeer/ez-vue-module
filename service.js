export default {
  getData() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ msg: 'EVERYBODY' });
      }, 1000);
    });
  }
}