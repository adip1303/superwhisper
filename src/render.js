import { RecordingState } from './stateMachine.js';

export const statusCopy = {
  [RecordingState.IDLE]: {
    eyebrow: 'Ready',
    title: 'Dictation is standing by',
    detail: 'Press Space to begin capture.',
  },
  [RecordingState.RECORDING]: {
    eyebrow: 'Recording',
    title: 'Listening now',
    detail: 'Voice is being captured into the current buffer.',
  },
  [RecordingState.PAUSED]: {
    eyebrow: 'Paused',
    title: 'Capture suspended',
    detail: 'The current buffer is retained. Press P to resume.',
  },
  [RecordingState.ENDED]: {
    eyebrow: 'Complete',
    title: 'This is working',
    detail: 'Committed from the active recording buffer.',
  },
};

export function render(state, elements) {
  const copy = statusCopy[state.recording];

  elements.views.forEach(
    ({
      panel,
      view,
      stateEyebrow,
      stateTitle,
      stateDetail,
      resultEyebrow,
      resultTitle,
      resultDetail,
    }) => {
      const isVisible = view === state.panelView;

      panel.dataset.recordingState = state.recording;
      panel.className = `sw-panel is-${state.recording} is-${view}${
        isVisible ? '' : ' is-view-hidden'
      }`;
      panel.setAttribute('aria-hidden', String(!isVisible));

      stateEyebrow.textContent = copy.eyebrow;
      stateTitle.textContent = copy.title;
      stateDetail.textContent = copy.detail;
      resultEyebrow.textContent = copy.eyebrow;
      resultTitle.textContent = copy.title;
      resultDetail.textContent = copy.detail;
    },
  );
}
