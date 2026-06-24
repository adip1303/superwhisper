export const RecordingState = Object.freeze({
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  ENDED: 'ended',
});

export const transitionTable = Object.freeze({
  [RecordingState.IDLE]: Object.freeze({
    Space: RecordingState.RECORDING,
  }),
  [RecordingState.RECORDING]: Object.freeze({
    Space: RecordingState.ENDED,
    KeyP: RecordingState.PAUSED,
    Escape: RecordingState.IDLE,
  }),
  [RecordingState.PAUSED]: Object.freeze({
    Space: RecordingState.ENDED,
    KeyP: RecordingState.RECORDING,
    Escape: RecordingState.IDLE,
  }),
  [RecordingState.ENDED]: Object.freeze({
    Space: RecordingState.RECORDING,
  }),
});

export const initialState = Object.freeze({
  recording: RecordingState.IDLE,
  panelView: 'expanded',
});

export function transition(state, keyCode) {
  const nextRecording = transitionTable[state.recording]?.[keyCode];

  if (!nextRecording) {
    return state;
  }

  return {
    ...state,
    recording: nextRecording,
  };
}

export function togglePanelView(state) {
  return {
    ...state,
    panelView: state.panelView === 'expanded' ? 'collapsed' : 'expanded',
  };
}
