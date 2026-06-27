import { inject } from '@vercel/analytics';
inject();

import './style.css';
import { initialState, transition } from './stateMachine.js';
import { render } from './render.js';

const elements = {
  views: Array.from(document.querySelectorAll('[data-view]')).map((panel) => ({
    panel,
    view: panel.dataset.view,
    stateEyebrow: panel.querySelector('[data-state-eyebrow]'),
    stateTitle: panel.querySelector('[data-state-title]'),
    stateDetail: panel.querySelector('[data-state-detail]'),
    resultEyebrow: panel.querySelector('[data-result-eyebrow]'),
    resultTitle: panel.querySelector('[data-result-title]'),
    resultDetail: panel.querySelector('[data-result-detail]'),
  })),
};

let recordingState = { recording: initialState.recording };
let viewMode = 'expanded';
let isMorphingToMini = false;
let morphToMiniGeneration = 0;
let morphToMiniInitTimeout = null;

function draw() {
  render({ ...recordingState, panelView: viewMode }, elements);
}

function setRecordingState(nextState) {
  if (nextState === recordingState) return;

  const prevRecording = recordingState.recording;
  recordingState = nextState;
  const nextRecording = recordingState.recording;

  const miniPanel = document.querySelector('[data-view="mini"]');

  if ((prevRecording === 'idle' || prevRecording === 'ended') && 
      nextRecording === 'recording') {

    if (viewMode === 'collapsed') {
      const collapsedPanel = document.querySelector('[data-view="collapsed"]');
      collapsedPanel.classList.add('is-morph-to-recording');

      setTimeout(() => {
        draw();
        collapsedPanel.classList.remove('is-morph-to-recording');

        const waveform = collapsedPanel.querySelector('.collapsed-waveform');
        waveform.style.opacity = '0';
        waveform.style.transition = 'none';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            waveform.style.transition = 'opacity 100ms ease';
            waveform.style.opacity = '1';
            setTimeout(() => {
              waveform.style.opacity = '';
              waveform.style.transition = '';
            }, 100);
          });
        });
      }, 300);
      return;
    }

    if (viewMode === 'expanded') {
      draw();
      return;
    }

    /* Mini view � run logo movement animation */
    miniPanel.classList.remove('anim-to-recording');
    void miniPanel.offsetWidth;
    miniPanel.classList.add('anim-to-recording');

    const activeLogo = miniPanel.querySelector('.mini-panel__active-logo');
    const pill = miniPanel.querySelector('.mini-panel__mode .mini-panel__hover-pill');

    if (activeLogo) void activeLogo.offsetWidth;
    if (pill) void pill.offsetWidth;

    setTimeout(() => {
      miniPanel.classList.remove('anim-to-recording');
      miniPanel.classList.add('recording-fade-in');
      draw();
      setTimeout(() => {
        miniPanel.classList.remove('recording-fade-in');
      }, 80);
    }, 630);
    return;
  }

  if ((prevRecording === 'recording' || prevRecording === 'paused') &&
      (nextRecording === 'idle' || nextRecording === 'ended')) {

    if (viewMode === 'collapsed') {
      const collapsedPanel = document.querySelector('[data-view="collapsed"]');
      const waveform = collapsedPanel.querySelector('.collapsed-waveform');

      waveform.style.transition = 'opacity 100ms ease';
      waveform.style.opacity = '0';

      setTimeout(() => {
        waveform.style.opacity = '';
        waveform.style.transition = '';
        collapsedPanel.classList.add('is-morph-to-idle');

        setTimeout(() => {
          draw();
          collapsedPanel.classList.remove('is-morph-to-idle');
        }, 300);
      }, 100);
      return;
    }

    if (viewMode === 'expanded') {
      draw();
      return;
    }

    /* Mini view � run logo movement animation */
    miniPanel.classList.remove('anim-to-idle');
    void miniPanel.offsetWidth;
    miniPanel.classList.add('anim-to-idle');

    setTimeout(() => {
      miniPanel.classList.remove('anim-to-idle');
      miniPanel.classList.add('logo-fade-in');
      draw();
      setTimeout(() => {
        miniPanel.classList.remove('logo-fade-in');
      }, 80);
    }, 650);
    return;
  }

  draw();
}

function setViewMode(nextViewMode) {
  if (nextViewMode === viewMode) return;

  /* MINI ? EXPANDED */
  if (viewMode === 'mini' && nextViewMode === 'expanded') {
    const miniPanel = document.querySelector('[data-view="mini"]');

    /* Step 1: fade out mini over 200ms */
    miniPanel.classList.add('is-fading-out');

    setTimeout(() => {
      /* Step 2: hide idle content via inline style BEFORE 
         draw() � survives render() className rewrite */
      const expandedPanel = document.querySelector('[data-view="expanded"]');
      const idleContent = expandedPanel.querySelector('.expanded-panel__idle-content');
      idleContent.style.opacity = '0';
      idleContent.style.transition = 'none';

      viewMode = 'expanded';
      draw();

      /* Re-add fading-in after draw() */
      expandedPanel.classList.add('is-fading-in');

      /* Step 3: fade in expanded over 450ms */
      setTimeout(() => {
        expandedPanel.classList.remove('is-fading-in');

        /* Step 4: 250ms pause */
        setTimeout(() => {

          /* Step 5: fade in idle content over 250ms */
          requestAnimationFrame(() => {
            idleContent.style.transition = 'opacity 250ms cubic-bezier(0.4, 0, 0.1, 1)';
            idleContent.style.opacity = '1';

            setTimeout(() => {
              idleContent.style.opacity = '';
              idleContent.style.transition = '';
            }, 250);
          });

        }, 250);
      }, 450);
    }, 300);
    return;
  }

  /* EXPANDED ? COLLAPSED */
  if (viewMode === 'expanded' && nextViewMode === 'collapsed') {
    const expandedPanel = document.querySelector('[data-view="expanded"]');

    /* Step 1: fade out expanded over 400ms */
    expandedPanel.style.opacity = '1';
    expandedPanel.style.transition = 'opacity 400ms cubic-bezier(0.4, 0, 0.1, 1)';

    requestAnimationFrame(() => {
      expandedPanel.style.opacity = '0';

      setTimeout(() => {
        /* Step 2: 200ms pause then switch view */
        expandedPanel.style.opacity = '';
        expandedPanel.style.transition = '';

        viewMode = 'collapsed';
        draw();

        /* Step 3: fade in collapsed over 200ms */
        const collapsedPanel = document.querySelector('[data-view="collapsed"]');
        collapsedPanel.style.opacity = '0';
        collapsedPanel.style.transition = 'none';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            collapsedPanel.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.1, 1)';
            collapsedPanel.style.opacity = '1';

            setTimeout(() => {
              collapsedPanel.style.opacity = '';
              collapsedPanel.style.transition = '';
            }, 200);
          });
        });
      }, 600);
    });
    return;
  }

  /* All other view changes' � instant */
  viewMode = nextViewMode;
  draw();
}

function handleKeyDown(event) {
  if (event.code === 'Space') event.preventDefault();
  if (event.repeat) return;

  if (event.code === 'Escape' && viewMode === 'expanded') {
    setViewMode('collapsed');
    return;
  }

  setRecordingState(transition(recordingState, event.code));
}

function handleViewAction(event) {
  if (event.type === 'keydown' && event.code !== 'Enter') return;
  const action = event.currentTarget.dataset.viewAction;
  event.preventDefault();
  event.stopPropagation();
  if (action === 'collapse' && viewMode === 'expanded') setViewMode('collapsed');
  if (action === 'expand' && viewMode === 'mini') setViewMode('expanded');
}

window.addEventListener('keydown', handleKeyDown);

document.querySelectorAll('[data-view-action]').forEach((control) => {
  control.addEventListener('click', handleViewAction);
  control.addEventListener('keydown', handleViewAction);
});


document.querySelector('[data-view="collapsed"]')
  .addEventListener('mouseenter', () => {
    const isRecordingOrPaused =
      recordingState.recording === 'recording' ||
      recordingState.recording === 'paused';

    if (!isRecordingOrPaused) return;
    if (viewMode !== 'collapsed') return;

    const collapsedPanel = document.querySelector('[data-view="collapsed"]');
    const miniPanel = document.querySelector('[data-view="mini"]');

    isMorphingToMini = true;

    /* Fade out waveform simultaneously with morph start */
    collapsedPanel.classList.add('is-waveform-fadeout');

    /* Set mini panel starting dimensions immediately */
    miniPanel.style.width = '130px';
    miniPanel.style.height = '72px';
    miniPanel.style.borderRadius = '36px';
    miniPanel.style.left = '98px';
    miniPanel.style.top = '0px';

    miniPanel.classList.add('is-morphing-to-mini');

    viewMode = 'mini';
    draw();

    /* Re-add after draw() since render() wipes className */
    miniPanel.classList.add('is-morphing-to-mini');

    const myGeneration = ++morphToMiniGeneration;

    /* Remove waveform fadeout after 50ms */
    morphToMiniInitTimeout = setTimeout(() => {
      collapsedPanel.classList.remove('is-waveform-fadeout');
    }, 50);

    setTimeout(() => {
      if (morphToMiniGeneration !== myGeneration) return;

      miniPanel.classList.remove('is-morphing-to-mini');

      requestAnimationFrame(() => {
        if (morphToMiniGeneration !== myGeneration) return;

        miniPanel.style.width = '';
        miniPanel.style.height = '';
        miniPanel.style.borderRadius = '';
        miniPanel.style.left = '';
        miniPanel.style.top = '';

        miniPanel.classList.add('is-morph-to-mini-done');
        isMorphingToMini = false;

        setTimeout(() => {
          if (morphToMiniGeneration !== myGeneration) return;
          miniPanel.classList.remove('is-morph-to-mini-done');
        }, 100);
      });
    }, 450);
  });

document.querySelector('.panel-container')
  .addEventListener('mouseenter', () => {
    const isRecordingOrPaused =
      recordingState.recording === 'recording' ||
      recordingState.recording === 'paused';

    if (isRecordingOrPaused) return;
    if (viewMode !== 'collapsed') return;

    viewMode = 'mini';
    draw();

    const miniPanel = document.querySelector('[data-view="mini"]');
    miniPanel.classList.add('is-entering');

    miniPanel.addEventListener('animationend', () => {
      miniPanel.classList.remove('is-entering');
    }, { once: true });
  });
document.querySelector('.panel-container')
  .addEventListener('mouseleave', (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    /* If morph-to-mini is in progress, abort it immediately */
    if (isMorphingToMini) {
      isMorphingToMini = false;
      morphToMiniGeneration++;
      clearTimeout(morphToMiniInitTimeout);
      morphToMiniInitTimeout = null;

      const collapsedPanel = document.querySelector('[data-view="collapsed"]');
      if (collapsedPanel) {
        collapsedPanel.classList.remove('is-waveform-fadeout');
      }

      /* If mini panel is not yet visible, just snap back */
      if (viewMode !== 'mini') {
        viewMode = 'collapsed';
        draw();
        return;
      }

      const miniPanel = document.querySelector('[data-view="mini"]');
      miniPanel.classList.remove('is-morphing-to-mini');
      miniPanel.classList.remove('is-morph-to-mini-done');

      /* Run morph-to-collapsed animation to reverse cleanly */
      miniPanel.classList.add('is-morphing-to-collapsed');

      setTimeout(() => {
        miniPanel.classList.remove('is-morphing-to-collapsed');
        viewMode = 'collapsed';
        draw();
      }, 450);
      return;
    }

    if (viewMode !== 'mini') return;

    const isRecordingOrPaused =
      recordingState.recording === 'recording' ||
      recordingState.recording === 'paused';

    const miniPanel = document.querySelector('[data-view="mini"]');

    if (isRecordingOrPaused) {
      /* Step 1: fade out mini contents over 50ms */
      miniPanel.classList.add('is-morph-to-collapsed');

      setTimeout(() => {
        /* Step 2: start morph over 500ms */
        miniPanel.classList.remove('is-morph-to-collapsed');
        miniPanel.classList.add('is-morphing-to-collapsed');

        setTimeout(() => {
          /* Step 3: morph complete � switch to collapsed */
          miniPanel.classList.remove('is-morphing-to-collapsed');
          viewMode = 'collapsed';
          draw();

          /* Step 4: fade in collapsed waveform over 100ms */
          const collapsedPanel =
            document.querySelector('[data-view="collapsed"]');
          const waveform =
            collapsedPanel.querySelector('.collapsed-waveform');

          waveform.style.opacity = '0';
          waveform.style.transition = 'none';

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              waveform.style.transition = 'opacity 100ms ease';
              waveform.style.opacity = '1';

              setTimeout(() => {
                waveform.style.opacity = '';
                waveform.style.transition = '';
              }, 100);
            });
          });
        }, 450);
      }, 50);

      return;
    }

    /* Normal idle/ended collapse */
    miniPanel.classList.add('is-exiting');

    miniPanel.addEventListener('animationend', () => {
      miniPanel.classList.remove('is-exiting');
      viewMode = 'collapsed';
      draw();

      const collapsedPanel = document.querySelector('[data-view="collapsed"]');
      collapsedPanel.style.transition = 'none';
      collapsedPanel.style.opacity = '0';

      requestAnimationFrame(() => {
        collapsedPanel.style.transition = 'opacity 100ms ease';
        collapsedPanel.style.opacity = '1';
      });
    }, { once: true });
  });

draw();
window.lucide?.createIcons({
  attrs: { 'stroke-width': 3 },
});

document.querySelector('.mini-panel__center').addEventListener('click', (e) => {
  if (recordingState.recording === 'recording' || 
      recordingState.recording === 'paused') return;
  setRecordingState(transition(recordingState, 'Space'));
});

document.querySelector('.mini-panel__mode').addEventListener('click', () => {
  if (recordingState.recording === 'recording' ||
      recordingState.recording === 'paused') {
    setRecordingState(transition(recordingState, 'Space'));
  }
});

document.querySelector('.mini-panel__record-control').addEventListener('click', () => {
  if (recordingState.recording === 'recording' ||
      recordingState.recording === 'paused') {
    setRecordingState(transition(recordingState, 'KeyP'));
  }
});

document.querySelector('.expanded-panel__controls').addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (action) setRecordingState(transition(recordingState, action));
});