import React from 'react';
import { HWProvider, ExtensionProvider } from '@elrondnetwork/erdjs';
import { loginAction } from 'redux/commonActions';
import { useDispatch, useSelector } from 'redux/DappProviderContext';
import {
  loginMethodSelector,
  walletConnectLoginSelector,
  networkSelector,
  proxySelector,
  walletLoginSelector
} from 'redux/selectors';
import { setAccount, setProvider, setWalletLogin } from 'redux/slices';
import { useWalletConnectLogin } from 'services/login/useWalletConnectLogin';
import { LoginMethodsEnum } from 'types/enums';
import {
  newWalletProvider,
  getAddress,
  getAccount,
  getLatestNonce
} from 'utils';

export default function ProviderInitializer() {
  const network = useSelector(networkSelector);
  const walletConnectLogin = useSelector(walletConnectLoginSelector);
  const loginMethod = useSelector(loginMethodSelector);
  const walletLogin = useSelector(walletLoginSelector);
  const proxy = useSelector(proxySelector);
  const dispatch = useDispatch();

  const { callbackRoute, logoutRoute } = walletConnectLogin
    ? walletConnectLogin
    : { callbackRoute: '', logoutRoute: '' };

  const [initWalletLoginProvider] = useWalletConnectLogin({
    callbackRoute,
    logoutRoute
  });

  React.useEffect(() => {
    initializeProvider();
  }, [loginMethod]);

  async function tryAuthenticateWalletUser() {
    try {
      if (walletLogin != null) {
        const provider = newWalletProvider(network);
        const address = await getAddress();
        if (address) {
          dispatch(setProvider(provider));
          dispatch(
            loginAction({ address, loginMethod: LoginMethodsEnum.wallet })
          );
          const account = await getAccount(address);
          dispatch(
            setAccount({
              balance: account.balance.toString(),
              address,
              nonce: getLatestNonce(account)
            })
          );
        }
        dispatch(setWalletLogin(null));
      }
    } catch (e) {
      console.error('Failed authenticating wallet user ', e);
    }
  }

  function setLedgerProvider() {
    const hwWalletP = new HWProvider(proxy);
    hwWalletP
      .init()
      .then((success: any) => {
        if (!success) {
          console.warn('Could not initialise ledger app');
          return;
        }
        dispatch(setProvider(hwWalletP));
      })
      .catch((err) => {
        console.error('Could not initialise ledger app', err);
      });
  }

  async function setExtensionProvider() {
    try {
      const address = await getAddress();
      const provider = ExtensionProvider.getInstance().setAddress(address);
      const success = await provider.init();

      if (success) {
        dispatch(setProvider(provider));
      } else {
        console.error(
          'Could not initialise extension, make sure Elrond wallet extension is installed.'
        );
      }
    } catch (err) {
      console.error('Unable to login to ExtensionProvider', err);
    }
  }

  function initializeProvider() {
    if (loginMethod == null) {
      return;
    }
    switch (loginMethod) {
      case LoginMethodsEnum.ledger: {
        setLedgerProvider();
        break;
      }

      case LoginMethodsEnum.walletconnect: {
        initWalletLoginProvider(false);
        break;
      }
      case LoginMethodsEnum.wallet: {
        const provider = newWalletProvider(network);
        dispatch(setProvider(provider));
        break;
      }

      case LoginMethodsEnum.extension: {
        setExtensionProvider();
        break;
      }

      case LoginMethodsEnum.none: {
        tryAuthenticateWalletUser();
        break;
      }
      default:
        return;
    }
  }

  return null;
}
