// Inicializa o valor do contador com 0
let contador = 0;

// Seleciona o botão e o elemento onde o número será exibido
const botao = document.getElementById('botaoClique');
const displayContador = document.getElementById('contador');

// Adiciona um ouvinte de evento ao botão
// Toda vez que o botão for clicado, o contador aumenta
botao.addEventListener('click', () => {
  contador++; // Incrementa o contador
  displayContador.textContent = contador; // Atualiza o texto exibido
});
