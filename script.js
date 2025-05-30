let contador = 0;

const botao = document.getElementById('botaoClique');
const displayContador = document.getElementById('contador');

botao.addEventListener('click', () => {
  contador++;
  displayContador.textContent = contador;
});

