import Link from 'next/link';
import styled from './header.module.scss';
import common from '../../styles/common.module.scss';

export default function Header() {
  return (
    <header className={styled.container}>
      <div className={common.content}>
        <Link href="/">
          <a>
            <img src="/logo.svg" alt="logo" />
          </a>
        </Link>
      </div>
    </header>
  );
}
