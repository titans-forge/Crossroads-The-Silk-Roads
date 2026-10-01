import { Heart, Handshake } from 'lucide-react';
import portraits from '../assets/caravan-portraits.webp';
import type { Person, PersonId } from '../types';

export function TravelerRail({ people, speaker, onSelect }: { people: Person[]; speaker?: PersonId; onSelect: (person: Person) => void }) {
  return <aside className="traveler-rail" aria-label="Household travelers and contacts"><div className="rail-heading"><span>Your household</span><strong>{people.filter(person => person.traveling).length} traveling · {people.filter(person => !person.traveling).length} {people.filter(person => !person.traveling).length === 1 ? 'contact' : 'contacts'}</strong></div><div className="traveler-list">{people.map(person => <button key={person.id} className={`traveler ${speaker === person.id ? 'traveler--speaking' : ''}`} onClick={() => onSelect(person)} aria-label={`View ${person.name}, health ${person.health}, trust ${person.trust}`}>
    <span className="traveler__portrait" aria-hidden="true" style={{backgroundImage:`url(${portraits})`,backgroundPosition:person.portraitPosition}} />
    <span className="traveler__body"><strong>{person.name}</strong><small>{person.traveling ? person.role : `Contact · ${person.location}`}</small><span className="traveler__meters"><span><Heart size={12} aria-hidden="true" /><span className="sr-only">Health </span>{person.health}</span><span><Handshake size={12} aria-hidden="true" /><span className="sr-only">Trust </span>{person.trust}</span></span></span>
  </button>)}</div><p className="rail-note">Health is general resilience, not a diagnosis. Trust measures the relationship. Both stop at 100.</p></aside>;
}
