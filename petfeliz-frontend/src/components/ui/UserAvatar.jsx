import React, { useState, useEffect } from 'react';
import { isValidAvatarUrl } from '../../utils/authStorage';

// Paleta de colores institucionales suaves con alto contraste de texto/ícono
const AVATAR_PALETTES = [
  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }, // Esmeralda / Menta PetFeliz
  { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd' }, // Azul Cielo
  { bg: '#fef3c7', color: '#d97706', border: '#fde68a' }, // Ámbar / Calidez
  { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' }, // Púrpura elegante
  { bg: '#fce7f3', color: '#db2777', border: '#fbcfe8' }, // Rosa suave
  { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' }, // Indigo
  { bg: '#ccfbf1', color: '#0d9488', border: '#99f6e4' }, // Teal / Turquesa
];

/**
 * Función determinista para obtener una paleta de color basada en ID o Nombre
 */

export const getAvatarPalette = (key) => {
  if (!key) return AVATAR_PALETTES[0];
  const str = String(key);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

/**
 * Componente Reutilizable UserAvatar
 * Si tiene foto válida la muestra. Si falla la imagen o no tiene foto,
 * muestra un ícono de FontAwesome sobre un círculo con color según el usuario.
 */
export default function UserAvatar({
  user,
  photoUrl,
  name,
  id,
  icon = 'fa-solid fa-user',
  size = '40px',
  fontSize = '1.1rem',
  className = '',
  style = {},
  alt = 'Avatar de usuario',
}) {
  // Extraer valores desde prop `user` o props independientes
  const targetPhoto = photoUrl || user?.foto_url || user?.foto || user?.avatar;
  const targetName = name || user?.nombre || user?.name || user?.email || 'Usuario';
  const targetId = id || user?.id || targetName;

  const [hasError, setHasError] = useState(false);

  // Reiniciar estado de error si cambia la foto
  useEffect(() => {
    setHasError(false);
  }, [targetPhoto]);

  const palette = getAvatarPalette(targetId);
  const isValidPhoto = isValidAvatarUrl(targetPhoto) && !hasError;

  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...style,
  };

  if (isValidPhoto) {
    return (
      <div
        className={`pf-user-avatar-container ${className}`}
        style={{
          ...containerStyle,
          backgroundColor: palette.bg,
        }}
      >
        <img
          src={targetPhoto}
          alt={targetName || alt}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`pf-user-avatar-fallback ${className}`}
      title={targetName}
      style={{
        ...containerStyle,
        backgroundColor: palette.bg,
        color: palette.color,
        border: `1.5px solid ${palette.border}`,
      }}
    >
      <i className={icon} style={{ fontSize }} />
    </div>
  );
}
