import useCommsTwoEventBooleanToggle from './useCommsTwoEventBooleanToggle';

export default function useCommsConnectedState() {
  return useCommsTwoEventBooleanToggle('commsOpen', 'commsClosed', false);
}
