/**
 * Retratos SVG Expressivos em Paleta Clean Girl Pastel
 */

import React from 'react';
import { CharacterAvatarId } from '../core/types';

interface CharacterAvatarProps {
  avatarId: CharacterAvatarId;
  mood?: 'neutral' | 'happy' | 'hint';
  size?: 'sm' | 'md' | 'lg';
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  avatarId,
  mood = 'neutral',
  size = 'md',
}) => {
  const dims =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
      ? 'w-14 h-14'
      : 'w-11 h-11';

  const bgColors: Record<CharacterAvatarId, string> = {
    kessia: 'bg-emerald-50 border-emerald-300',
    lino: 'bg-sky-50 border-sky-300',
    milo: 'bg-amber-50 border-amber-300',
    nora: 'bg-pink-50 border-pink-300',
    geoda: 'bg-purple-50 border-purple-300',
    solis: 'bg-yellow-50 border-yellow-300',
  };

  return (
    <div
      className={`${dims} rounded-2xl border-2 ${bgColors[avatarId]} flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {avatarId === 'kessia' && (
          <>
            <ellipse cx="32" cy="21" rx="22" ry="6" fill="#34D399" />
            <path d="M18 21C18 12 24 8 32 8C40 8 46 12 46 21H18Z" fill="#10B981" />
            <path d="M40 12C45 7 52 9 50 15C48 19 42 17 40 12Z" fill="#6EE7B7" />
            <circle cx="32" cy="36" r="14" fill="#FDE68A" />
            <circle cx="23" cy="38" r="2.5" fill="#F9A8D4" opacity="0.6" />
            <circle cx="41" cy="38" r="2.5" fill="#F9A8D4" opacity="0.6" />
            {mood === 'happy' ? (
              <>
                <path d="M24 34C25 32 28 32 29 34" stroke="#44403C" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M35 34C36 32 39 32 40 34" stroke="#44403C" strokeWidth="2.4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="26.5" cy="34" r="2.2" fill="#44403C" />
                <circle cx="37.5" cy="34" r="2.2" fill="#44403C" />
              </>
            )}
            <path
              d={mood === 'hint' ? 'M28 42C30 41 34 41 36 42' : 'M26 40C28 44 36 44 38 40'}
              stroke="#44403C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}

        {avatarId === 'lino' && (
          <>
            <path d="M25 18C22 10 17 10 16 13" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="16" cy="13" r="3" fill="#38BDF8" />
            <path d="M39 18C42 10 47 10 48 13" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="48" cy="13" r="3" fill="#38BDF8" />
            <circle cx="32" cy="36" r="14" fill="#FEF08A" />
            <path d="M18 30C22 24 42 24 46 30" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="26.5" cy="35" r="2.2" fill="#44403C" />
            <circle cx="37.5" cy="35" r="2.2" fill="#44403C" />
            <path
              d={mood === 'hint' ? 'M28 43H36' : 'M26 41C29 45 35 45 38 41'}
              stroke="#44403C"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}

        {avatarId === 'milo' && (
          <>
            <circle cx="32" cy="14" r="6" fill="#FBBF24" />
            <circle cx="32" cy="37" r="14" fill="#FDE68A" />
            <path d="M17 35C17 23 24 19 32 19C40 19 47 23 47 35" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            <circle cx="26.5" cy="36" r="2.3" fill="#44403C" />
            <circle cx="37.5" cy="36" r="2.3" fill="#44403C" />
            <path d="M27 43C30 46 34 46 37 43" stroke="#44403C" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}

        {avatarId === 'nora' && (
          <>
            <path d="M16 28C16 17 23 12 32 12C41 12 48 17 48 28H16Z" fill="#F472B6" />
            <rect x="25" y="16" width="14" height="6" rx="3" fill="#FCE7F3" />
            <circle cx="32" cy="38" r="13.5" fill="#FED7AA" />
            <circle cx="26.5" cy="36" r="2.2" fill="#44403C" />
            <circle cx="37.5" cy="36" r="2.2" fill="#44403C" />
            <path d="M26 42C29 45 35 45 38 42" stroke="#44403C" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}

        {avatarId === 'geoda' && (
          <>
            <polygon points="32,7 41,19 37,26 27,26 23,19" fill="#C084FC" />
            <polygon points="20,14 27,22 21,27 15,21" fill="#A855F7" />
            <polygon points="44,14 49,21 43,27 37,22" fill="#A855F7" />
            <polygon points="32,20 46,30 43,48 32,54 21,48 18,30" fill="#F3E8FF" />
            <circle cx="26.5" cy="36" r="2.3" fill="#581C87" />
            <circle cx="37.5" cy="36" r="2.3" fill="#581C87" />
            <path d="M27 43C30 46 34 46 37 43" stroke="#581C87" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}

        {avatarId === 'solis' && (
          <>
            <circle cx="32" cy="32" r="22" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 4" />
            <polygon points="32,8 37,20 27,20" fill="#F59E0B" />
            <circle cx="32" cy="36" r="13.5" fill="#FEF08A" />
            <circle cx="26.5" cy="35" r="2.2" fill="#44403C" />
            <circle cx="37.5" cy="35" r="2.2" fill="#44403C" />
            <path d="M26 41C29 45 35 45 38 41" stroke="#44403C" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
};
