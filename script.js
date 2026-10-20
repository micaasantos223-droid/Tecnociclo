document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 0. TEMA CLARO / ESCURO
  // O tema salvo já foi aplicado no <head>, antes da página aparecer.
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  const syncThemeButton = () => {
    const dark = root.getAttribute('data-theme') === 'escuro';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle.title = dark ? 'Tema claro' : 'Tema escuro';
  };

  if (themeToggle) {
    syncThemeButton();
    themeToggle.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') !== 'escuro';
      if (dark) root.setAttribute('data-theme', 'escuro');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('tecnociclo-tema', dark ? 'escuro' : 'claro'); } catch (e) { /* navegação privada */ }
      syncThemeButton();
    });
  }

  // 1. NAVEGAÇÃO MOBILE E ACESSIBILIDADE
  const menuButton = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const links = document.querySelectorAll('.nav-links a');

  if (menuButton && navLinks) {
    const setMenu = (open) => {
      navLinks.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    };

    menuButton.addEventListener('click', () => {
      setMenu(!navLinks.classList.contains('open'));
    });

    links.forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navLinks.classList.contains('open')) {
        setMenu(false);
        menuButton.focus();
      }
    });
  }

  // 2. ROLAGEM: LINK ATIVO, BARRA DE LEITURA E VOLTAR AO TOPO
  const sections = Array.from(document.querySelectorAll('main section[id]'))
    .filter(section => document.querySelector(`.nav-links a[href="#${section.id}"]`));
  const progressBar = document.getElementById('readProgress');
  const toTop = document.getElementById('toTop');

  const onScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const nearBottom = scrollY >= maxScroll - 4;

    // seção ativa = a última cujo topo já passou do cabeçalho
    let current = sections[0];
    sections.forEach(section => {
      if (scrollY >= section.offsetTop - 120) current = section;
    });
    if (nearBottom) current = sections[sections.length - 1];

    sections.forEach(section => {
      const navLink = document.querySelector(`.nav-links a[href="#${section.id}"]`);
      const active = section === current;
      navLink.classList.toggle('active', active);
      if (active) navLink.setAttribute('aria-current', 'true');
      else navLink.removeAttribute('aria-current');
    });

    if (progressBar) {
      progressBar.style.transform = `scaleX(${maxScroll > 0 ? scrollY / maxScroll : 0})`;
    }

    if (toTop) toTop.classList.toggle('show', scrollY > 700);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      document.querySelector('.brand').focus({ preventScroll: true });
    });
  }

  // 3. ANIMAÇÃO DE ENTRADA E CONTADORES
  const animated = document.querySelectorAll('.fade-in, .card-animate');
  const counters = document.querySelectorAll('.count');

  const formatNumber = (value, decimals) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.to);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) {
      el.textContent = formatNumber(target, decimals);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target.classList.contains('count')) runCounter(entry.target);
        else entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    animated.forEach(el => observer.observe(el));
    counters.forEach(el => {
      if (!reduceMotion) el.textContent = formatNumber(0, parseInt(el.dataset.decimals || '0', 10));
      observer.observe(el);
    });
  } else {
    animated.forEach(el => el.classList.add('visible'));
  }

  // 4. CENA ANIMADA: PAUSAR E ENQUADRAR NO CELULAR
  const scene = document.getElementById('scene');
  const sceneToggle = document.getElementById('sceneToggle');
  const sceneSvg = document.getElementById('sceneSvg');

  if (scene && sceneToggle) {
    sceneToggle.addEventListener('click', () => {
      const paused = scene.classList.toggle('paused');
      sceneToggle.setAttribute('aria-pressed', String(paused));
      sceneToggle.querySelector('.toggle-icon use').setAttribute('href', paused ? '#i-play' : '#i-pause');
      sceneToggle.querySelector('.toggle-text').textContent = paused ? 'Continuar animação' : 'Pausar animação';
    });

    // pausa a cena quando ela sai da tela, para economizar bateria
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (!sceneToggle.matches('[aria-pressed="true"]')) {
          scene.classList.toggle('paused', !entry.isIntersecting);
        }
      }).observe(scene);
    }
  }

  if (sceneSvg) {
    // em telas estreitas, aproxima a câmera na parte central da cena
    const frameScene = () => {
      sceneSvg.setAttribute('viewBox', window.innerWidth <= 640 ? '580 0 600 300' : '0 0 1200 300');
    };
    frameScene();
    window.addEventListener('resize', frameScene);
  }

  // 5. FLUXO DE DESTINAÇÃO CLICÁVEL
  const flowDetails = {
    1: '<strong>Uso do produto:</strong> escolher aparelhos duráveis, usar capa e película, manter o sistema atualizado e cuidar da bateria fazem o equipamento durar mais e adiam o descarte.',
    2: '<strong>Descarte correto:</strong> separe o aparelho do lixo comum, faça backup, apague seus dados e entregue o produto desligado. Pilhas e baterias vão em coletores próprios.',
    3: '<strong>Ponto de coleta:</strong> o aparelho é deixado em um PEV, em uma loja com coletor ou em um ecoponto da prefeitura.',
    4: '<strong>Triagem:</strong> os aparelhos são separados por tipo e desmontados, e os componentes perigosos, como as baterias, são retirados antes da reciclagem.',
    5: '<strong>Reciclagem e reaproveitamento:</strong> materiais como metais e plásticos podem voltar para a indústria como matéria-prima, fechando o ciclo.'
  };

  const flowTabs = Array.from(document.querySelectorAll('button.flow-step'));
  const flowDetail = document.getElementById('flowDetail');

  const selectStep = (tab, focus) => {
    flowTabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    flowDetail.innerHTML = flowDetails[tab.dataset.step];
    flowDetail.setAttribute('aria-labelledby', tab.id);
    flowDetail.style.animation = 'none';
    void flowDetail.offsetWidth; // reinicia a animação
    flowDetail.style.animation = '';
    if (focus) tab.focus();
  };

  flowTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectStep(tab, false));
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (event.key in keys) {
        event.preventDefault();
        const next = flowTabs[(i + keys[event.key] + flowTabs.length) % flowTabs.length];
        selectStep(next, true);
      } else if (event.key === 'Home') {
        event.preventDefault();
        selectStep(flowTabs[0], true);
      } else if (event.key === 'End') {
        event.preventDefault();
        selectStep(flowTabs[flowTabs.length - 1], true);
      }
    });
  });

  // 6. MITO OU VERDADE
  document.querySelectorAll('.myth-card').forEach(card => {
    const back = card.querySelector('.myth-back');
    const front = card.querySelector('.myth-front');
    back.setAttribute('aria-hidden', 'true');

    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('flipped');
      card.setAttribute('aria-expanded', String(flipped));
      back.setAttribute('aria-hidden', String(!flipped));
      front.setAttribute('aria-hidden', String(flipped));
    });
  });

  // 7. DESAFIO TECNOCICLO (QUIZ PASSO A PASSO)
  const quizApp = document.getElementById('quizApp');

  const questions = [
    {
      q: 'Seu celular está lento. Você...',
      options: ['Troca logo por um novo', 'Espera um pouco e decide depois', 'Libera espaço, atualiza ou leva para conserto'],
      why: 'Muitas vezes a lentidão tem solução: liberar espaço, atualizar o sistema ou trocar a bateria pode estender a vida útil do aparelho e adiar um novo resíduo.'
    },
    {
      q: 'Você tem um eletrônico parado em casa, ainda funcionando. Você...',
      options: ['Deixa guardado na gaveta', 'Pensa em vender ou doar algum dia', 'Apaga os dados e doa ou vende agora'],
      why: 'Um aparelho parado perde valor e utilidade com o tempo. Doar ou vender logo, depois de apagar seus dados, devolve o equipamento ao ciclo de uso.'
    },
    {
      q: 'Na hora de descartar um eletrônico quebrado, você...',
      options: ['Coloca junto com o lixo comum', 'Deixa na calçada para alguém levar', 'Leva a um ponto de coleta ou à loja'],
      why: 'Eletrônicos podem conter substâncias perigosas e não devem ir para o lixo comum nem ficar na rua. O destino certo é um ponto de coleta.'
    },
    {
      q: 'E as pilhas e baterias usadas?',
      options: ['Vão para o lixo do banheiro ou da cozinha', 'Ficam juntas num pote, sem destino certo', 'Vão para um coletor específico'],
      why: 'Pilhas e baterias fazem parte da logística reversa obrigatória da Lei nº 12.305/2010 e devem ir para coletores específicos.'
    },
    {
      q: 'Ao comprar um eletrônico novo, você...',
      options: ['Compra sempre o lançamento', 'Compara só o preço', 'Avalia durabilidade, garantia e se o antigo ainda resolve'],
      why: 'O resíduo que não é gerado é o melhor resíduo. Escolher aparelhos duráveis e com garantia, e só trocar quando necessário, reduz o lixo eletrônico.'
    }
  ];

  const profiles = [
    { min: 9, icon: 'sprout', title: 'Guardião da Tecnologia', text: 'Você já pensa no ciclo completo antes de descartar. Compartilhe esse conhecimento!' },
    { min: 6, icon: 'recycle', title: 'Usuário Consciente', text: 'Você está no caminho certo. Falta pouco para fechar o ciclo.' },
    { min: 3, icon: 'search', title: 'Explorador do Ciclo', text: 'Algumas mudanças de hábito já farão grande diferença. Veja as dicas abaixo.' },
    { min: 0, icon: 'flag', title: 'Começo de Jornada', text: 'Agora que conhece a campanha, você sabe por onde começar.' }
  ];

  if (quizApp) {
    const answers = new Array(questions.length).fill(null);
    let current = 0;
    const letters = ['A', 'B', 'C'];
    // a melhor resposta vale 2 pontos; a ordem exibida é embaralhada uma vez por pergunta
    const order = questions.map(() => [0, 1, 2].sort(() => Math.random() - .5));

    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text !== undefined) node.textContent = text;
      return node;
    };

    // ícone do conjunto do site (svg + use)
    const icon = (name) => {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'ic');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', `#i-${name}`);
      svg.append(use);
      return svg;
    };

    const renderQuestion = (focusTitle) => {
      const data = questions[current];
      quizApp.innerHTML = '';

      const top = el('div', 'quiz-top');
      top.append(el('span', '', `PERGUNTA ${current + 1} DE ${questions.length}`));
      top.append(el('span', '', `${Math.round((current / questions.length) * 100)}%`));

      const bar = el('div', 'quiz-bar');
      const fill = el('span');
      fill.style.width = `${(current / questions.length) * 100}%`;
      bar.append(fill);
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Progresso do desafio');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(questions.length));
      bar.setAttribute('aria-valuenow', String(current));

      const title = el('h3', 'quiz-q', data.q);
      title.id = 'quizQuestion';
      title.tabIndex = -1;

      const group = el('div', 'quiz-options');
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-labelledby', 'quizQuestion');

      const optionButtons = [];
      order[current].forEach((value, pos) => {
        const btn = el('button', 'quiz-option');
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String(answers[current] === value));
        btn.dataset.value = value;
        btn.append(el('span', 'letter', letters[pos]), el('span', '', data.options[value]));
        optionButtons.push(btn);
        group.append(btn);
      });

      const selected = optionButtons.find(b => b.getAttribute('aria-checked') === 'true');
      optionButtons.forEach(b => { b.tabIndex = (selected ? b === selected : b === optionButtons[0]) ? 0 : -1; });

      const nav = el('div', 'quiz-nav');
      const back = el('button', 'button ghost');
      back.append(icon('left'), document.createTextNode(' Voltar'));
      back.type = 'button';
      back.disabled = current === 0;
      const isLast = current === questions.length - 1;
      const next = el('button', 'button primary');
      next.append(document.createTextNode(isLast ? 'Ver meu resultado ' : 'Próxima '), icon('right'));
      next.type = 'button';
      next.disabled = answers[current] === null;
      nav.append(back, next);

      const choose = (btn) => {
        answers[current] = Number(btn.dataset.value);
        optionButtons.forEach(b => {
          const on = b === btn;
          b.setAttribute('aria-checked', String(on));
          b.tabIndex = on ? 0 : -1;
        });
        next.disabled = false;
      };

      optionButtons.forEach((btn, i) => {
        btn.addEventListener('click', () => choose(btn));
        btn.addEventListener('keydown', (event) => {
          const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
          if (event.key in keys) {
            event.preventDefault();
            const target = optionButtons[(i + keys[event.key] + optionButtons.length) % optionButtons.length];
            choose(target);
            target.focus();
          }
        });
      });

      back.addEventListener('click', () => { current -= 1; renderQuestion(true); });
      next.addEventListener('click', () => {
        if (answers[current] === null) return;
        if (isLast) renderResult();
        else { current += 1; renderQuestion(true); }
      });

      quizApp.append(top, bar, title, group, nav);
      if (focusTitle) title.focus();
    };

    const renderResult = () => {
      const score = answers.reduce((sum, v) => sum + v, 0);
      const max = questions.length * 2;
      const profile = profiles.find(p => score >= p.min);

      quizApp.innerHTML = '';
      const wrap = el('div', 'quiz-final');

      const scoreWrap = el('div', 'score-wrap');
      const radius = 44;
      const circumference = 2 * Math.PI * radius;
      const ns = 'http://www.w3.org/2000/svg';
      const ring = document.createElementNS(ns, 'svg');
      ring.setAttribute('class', 'score-ring');
      ring.setAttribute('viewBox', '0 0 104 104');
      ring.setAttribute('aria-hidden', 'true');
      const track = document.createElementNS(ns, 'circle');
      const value = document.createElementNS(ns, 'circle');
      [track, value].forEach(c => { c.setAttribute('cx', '52'); c.setAttribute('cy', '52'); c.setAttribute('r', String(radius)); });
      track.setAttribute('class', 'track');
      value.setAttribute('class', 'value');
      value.style.strokeDasharray = String(circumference);
      value.style.strokeDashoffset = String(circumference);
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', '52');
      label.setAttribute('y', '60');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '24');
      label.textContent = `${score}/${max}`;
      ring.append(track, value, label);

      const headText = el('div');
      const title = el('h3', 'result-title');
      title.append(icon(profile.icon), document.createTextNode(' ' + profile.title));
      title.tabIndex = -1;
      headText.append(title, el('p', 'result-score', `${score} de ${max} pontos. ${profile.text}`));
      scoreWrap.append(ring, headText);

      const list = el('ul', 'result-list');
      questions.forEach((data, i) => {
        const v = answers[i];
        const item = el('li', v === 2 ? 'ok' : v === 1 ? 'mid' : 'bad');
        const verdict = v === 2 ? 'ótima escolha' : v === 1 ? 'dá para melhorar' : 'atenção';
        item.append(el('b', '', `Pergunta ${i + 1} (${verdict}): `), document.createTextNode(data.why));
        list.append(item);
      });

      const reset = el('button', 'quiz-reset', 'Refazer o desafio');
      reset.type = 'button';
      reset.addEventListener('click', () => {
        answers.fill(null);
        current = 0;
        renderQuestion(true);
      });

      const status = el('p', 'sr-only', `Resultado: ${profile.title}, ${score} de ${max} pontos.`);
      status.setAttribute('role', 'status');

      wrap.append(scoreWrap, list, reset, status);
      quizApp.append(wrap);
      title.focus();

      requestAnimationFrame(() => requestAnimationFrame(() => {
        value.style.strokeDashoffset = String(circumference * (1 - score / max));
      }));
    };

    renderQuestion(false);
  }

  // 8. COMPARTILHAR A CAMPANHA
  const shareBtn = document.getElementById('shareBtn');
  const shareMsg = document.getElementById('shareMsg');

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const data = {
        title: 'TecnoCiclo | Tecnologia que continua',
        text: 'Conheça a campanha TecnoCiclo sobre o descarte correto de lixo eletrônico e faça o desafio:',
        url: window.location.href.split('#')[0]
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
        } else {
          await navigator.clipboard.writeText(data.url);
          shareMsg.textContent = 'Link copiado! Agora é só colar e enviar.';
        }
      } catch (error) {
        if (error && error.name !== 'AbortError') {
          shareMsg.textContent = `Copie o link: ${data.url}`;
        }
      }
    });
  }
});
