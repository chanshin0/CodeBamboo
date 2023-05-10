import React from 'react';
import Link from 'next/link';
import { useRecoilState } from 'recoil';
import { loginModalState, userState } from '@/recoil/user';

interface Props {
  isHovered: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BarItems = ({ isHovered, setIsMenuOpen }: Props) => {
  const [user, setUser] = useRecoilState(userState);
  const [_, setIsOpen] = useRecoilState(loginModalState);

  const handleModalToggle = (event: React.MouseEvent) => {
    setIsOpen((prev) => !prev);
  };

  const HoverBarItems = isHovered ? (
    <>
      <div onClick={() => setIsMenuOpen(false)}>
        <Link href={'/topics'}>
          <div>New</div>
        </Link>
        <Link href={'/search'}>
          <div>Search</div>
        </Link>
      </div>
      <div
        id="profile-div"
        className="h-fit flex items-center cursor-pointer
                  
                  md:mb-8"
        onClick={handleModalToggle}
      >
        <img src={user.image} alt="" className="h-12" />
        <span>
          {user.isLoggedIn ? (
            user.nickname
          ) : (
            <button className="login-button">Login</button>
          )}
        </span>
        {user.isLoggedIn && <button className="login-button">로그아웃</button>}
      </div>
    </>
  ) : (
    <>
      <div className="flex flex-col items-center">
        <Link href={'/topics'}>
          {' '}
          <img src="/images/icons/new_icon.png" className="mt-5" />{' '}
        </Link>
        <Link href={'/search'}>
          {' '}
          <img src="/images/icons/search_icon.png" className="mt-5" />{' '}
        </Link>
      </div>
      <div className="mb-8 cursor-pointer" onClick={handleModalToggle}>
        <img src={user.image} alt="" className="h-12" />
      </div>
    </>
  );

  return (
    <div
      className="bg-inherit flex flex-col
                    absolute top-full right-0 h-80 w-1/2 
                    md:static md:h-full md:w-auto md:justify-between"
    >
      {HoverBarItems}
    </div>
  );
};
