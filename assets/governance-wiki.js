(() => {
  'use strict';
  const query = document.querySelector('#wikiQuery');
  const filters = [...document.querySelectorAll('.wikiFilter')];
  const cards = [...document.querySelectorAll('.wikiCard')];
  const count = document.querySelector('#resultCount');
  const empty = document.querySelector('#wikiEmpty');
  let category = 'all';
  const normalize = value => value.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function apply() {
    const term = normalize(query.value.trim());
    let visible = 0;
    cards.forEach(card => {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const searchText = normalize(`${card.dataset.search} ${card.textContent}`);
      const show = categoryMatch && (!term || searchText.includes(term));
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'Thema' : 'Themen'} sichtbar`;
    empty.hidden = visible !== 0;
  }
  query.addEventListener('input', apply);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    filters.forEach(item => item.classList.toggle('active', item === button));
    apply();
  }));
  apply();
})();
