import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../hooks/useLang';

const AdminPanel: React.FC = () => {
  const t = useLang();
  return (
    <div>
      <h1>Admin Panel</h1>
      <ul>
        <li><Link to="/admin/users">{t('users')}</Link></li>
        <li><Link to="/admin/breweries">{t('breweries')}</Link></li>
        <li><Link to="/admin/kegs">{t('kegs')}</Link></li>
      </ul>
    </div>
  );
};

export default AdminPanel; 