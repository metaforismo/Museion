interface BrowserPolicy { allowsFeature(feature: string): boolean }
export interface DictationEnvironment {
  isSecureContext: boolean;
  recognizerAvailable: boolean;
  document: { permissionsPolicy?: BrowserPolicy; featurePolicy?: BrowserPolicy };
}

/** Only offer dictation when the browser and page policy explicitly allow it.
 * Unknown policy support stays hidden instead of offering a broken control. */
export function browserDictationAvailable(environment: DictationEnvironment): boolean {
  if (!environment.isSecureContext || !environment.recognizerAvailable) return false;
  const policy = environment.document.permissionsPolicy ?? environment.document.featurePolicy;
  try { return policy?.allowsFeature("microphone") === true; } catch { return false; }
}
