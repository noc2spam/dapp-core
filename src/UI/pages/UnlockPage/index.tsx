import React from 'react';
import { useGetLoginInfo } from 'hooks';
import ExtensionLoginButton from 'UI/extension/LoginButton';

import LedgerLoginButton from 'UI/ledger/LoginButton';
import WalletConnectLoginButton from 'UI/walletConnect/WalletConnectLoginButton';
import WebWalletLoginButton from 'UI/webWallet/LoginButton';
import { getGeneratedClasses } from 'utils';
import { Props } from './types';

export const UnlockPage = ({
  loginRoute,
  title = 'Login',
  className = 'unlock-page',
  shouldRenderDefaultCss = true,
  LedgerLoginButtonText = 'Ledger',
  description = 'Pick a login method',
  WalletConnectLoginButtonText = 'Maiar',
  ExtensionLoginButtonText = 'Extension',
  WebWalletLoginButtonText = 'Web wallet'
}: Props) => {
  const generatedClasses = getGeneratedClasses(
    className,
    shouldRenderDefaultCss,
    {
      wrapper: 'home d-flex flex-fill align-items-center',
      title: 'mb-4',
      description: 'mb-4',
      cardContainer: 'm-auto',
      card: 'card my-4 text-center',
      cardBody: 'card-body py-4 px-2 px-sm-2 mx-lg-4'
    }
  );
  const { isLoggedIn } = useGetLoginInfo();

  React.useEffect(() => {
    console.log('\x1b[42m%s\x1b[0m', isLoggedIn);

    if (isLoggedIn) {
      window.location.href = loginRoute;
    }
  }, [isLoggedIn]);

  return (
    <div className={generatedClasses.wrapper}>
      <div className={generatedClasses.cardContainer}>
        <div className={generatedClasses.card}>
          <div className={generatedClasses.cardBody}>
            <h4 className={generatedClasses.title}>{title}</h4>
            <p className={generatedClasses.description}>{description}</p>
            <ExtensionLoginButton
              callbackRoute={loginRoute}
              loginButtonText={ExtensionLoginButtonText}
            />
            <WebWalletLoginButton
              callbackRoute={loginRoute}
              loginButtonText={WebWalletLoginButtonText}
            />
            <LedgerLoginButton
              loginButtonText={LedgerLoginButtonText}
              callbackRoute={loginRoute}
            />
            <WalletConnectLoginButton
              callbackRoute={loginRoute}
              loginButtonText={WalletConnectLoginButtonText}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockPage;
