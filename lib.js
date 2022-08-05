

() => {
  class lib {
    static action() {
      let h1 = document.createElement('h1');
      h1.innerHTML = 'ACTION NOW';
      document.querySelector('h1').parentNode.appendChild(h1);
    }
  }
  window.lib = lib;
}