const BLOCKLIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'dick', 'cock', 'pussy',
  'cunt', 'bastard', 'whore', 'slut', 'piss', 'crap', 'douche',
  'twat', 'wanker', 'bollocks', 'arse', 'motherfucker', 'bullshit',
  'horseshit', 'asshole', 'dumbass', 'jackass', 'shitty', 'fucked',
  'fucking', 'fucker', 'bitchy', 'dammit', 'goddamn', 'nigger',
  'nigga', 'retard', 'retarded', 'fag', 'faggot',
];

const pattern = new RegExp(
  '\\b(' + BLOCKLIST.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

export function filterText(text) {
  if (!text) return text;
  return text.replace(pattern, '***');
}

export function filterObject(obj, keys) {
  const filtered = { ...obj };
  for (const key of keys) {
    if (typeof filtered[key] === 'string') {
      filtered[key] = filterText(filtered[key]);
    }
  }
  return filtered;
}

export function filterArray(arr, keys) {
  return arr.map(item => filterObject(item, keys));
}
