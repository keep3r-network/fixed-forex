import React, { useState, useEffect } from 'react';

import { Typography, Switch, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import { useRouter } from "next/router";
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';

import WbSunnyOutlinedIcon from '@material-ui/icons/WbSunnyOutlined';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';

import { CONNECT_WALLET, ACCOUNT_CONFIGURED, ACCOUNT_CHANGED, FIXED_FOREX_BALANCES_RETURNED, FIXED_FOREX_CLAIM_VECLAIM, FIXED_FOREX_VECLAIM_CLAIMED, FIXED_FOREX_UPDATED, ERROR } from '../../stores/constants';

import Unlock from '../unlock';

import stores from '../../stores';
import { formatAddress } from '../../utils';

import classes from './header.module.css';
import HelpIcon from '@material-ui/icons/Help';
import AboutModal from './aboutModal';
import { useHotkeys } from 'react-hotkeys-hook';

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 58,
    height: 32,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    paddingTop: 1.5,
    width: '75%',
    margin: 'auto',
    '&$checked': {
      transform: 'translateX(28px)',
      color: 'rgba(128,128,128, 1)',
      width: '30%',
      '& + $track': {
        backgroundColor: 'rgba(0,0,0, 0.3)',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    },
  },
  track: {
    borderRadius: 32 / 2,
    border: '1px solid rgba(128,128,128, 0.2)',
    backgroundColor: 'rgba(0,0,0, 0)',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

function Header(props) {

  const accountStore = stores.accountStore.getStore('account');
  const router = useRouter();

  const [account, setAccount] = useState(accountStore);
  const [toggleAboutModal, setToggleAboutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [chainInvalid, setChainInvalid] = useState(false)
  const [claimable, setClaimable] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };
    const accountChanged = () => {
      const invalid = stores.accountStore.getStore('chainInvalid');
      setChainInvalid(invalid)
    }
    const balancesReturned = () => {
      const rewards = stores.fixedForexStore.getStore('rewards')
      setClaimable(rewards?.veClaimRewards?.claimable)
    }
    const claimedReturned = () => {
      const rewards = stores.fixedForexStore.getStore('rewards')
      setClaimable(rewards?.veClaimRewards?.claimable)
      setLoading(false)
    }

    const invalid = stores.accountStore.getStore('chainInvalid');
    setChainInvalid(invalid)

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(FIXED_FOREX_UPDATED, balancesReturned);
    stores.emitter.on(FIXED_FOREX_BALANCES_RETURNED, balancesReturned);
    stores.emitter.on(FIXED_FOREX_VECLAIM_CLAIMED, claimedReturned);
    stores.emitter.on(ERROR, claimedReturned);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(FIXED_FOREX_UPDATED, balancesReturned);
      stores.emitter.removeListener(FIXED_FOREX_BALANCES_RETURNED, balancesReturned);
      stores.emitter.removeListener(FIXED_FOREX_VECLAIM_CLAIMED, claimedReturned);
      stores.emitter.removeListener(ERROR, claimedReturned);
    };
  }, []);

  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);
  }, []);

  const navigate = (url) => {
    router.push(url)
  }

  const callClaim = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: FIXED_FOREX_CLAIM_VECLAIM, content: {} })
  }

  return (
    <div>
      <Paper elevation={0} className={classes.headerContainer}>
        {
          props.title && <Typography className={ classes.pageTitle }>
            { props.title }
          </Typography>
        }
        <div className={classes.themeSelectContainer}>
          <StyledSwitch
            icon={<Brightness2Icon className={classes.switchIcon} />}
            checkedIcon={<WbSunnyOutlinedIcon className={classes.switchIcon} />}
            checked={darkMode}
            onChange={handleToggleChange}
          />
        </div>
        <Button
          disableElevation
          className={classes.prettyButton}
          variant="contained"
          startIcon={<MonetizationOnIcon />}
          onClick={() => callClaim()}
          disabled={ loading }
        >
          <Typography className={classes.headBtnTxt}>Claim { claimable == undefined ? 0 : parseFloat(claimable).toFixed(0) } vKP3R</Typography>
        </Button>
        <Button
          disableElevation
          className={classes.accountButton}
          variant="contained"
          color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
          startIcon={<HelpIcon />}
          onClick={() => setToggleAboutModal(!toggleAboutModal)}
        >
          <Typography className={classes.headBtnTxt}>Need help?</Typography>
        </Button>
        <Button
          disableElevation
          className={classes.accountButton}
          variant="contained"
          color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
          onClick={onAddressClicked}>
          {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
          <Typography className={classes.headBtnTxt}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
        </Button>
        {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
        {toggleAboutModal && <AboutModal setToggleAboutModal={setToggleAboutModal} />}
    </Paper>
    {chainInvalid ? (
      <div className={classes.chainInvalidError}>
        <div className={classes.ErrorContent}>
          <div className={classes.unitato}></div>
          <Typography className={classes.ErrorTxt}>
            The chain you're connected to isn't supported. Please check that your wallet is connected to Ethereum Mainnet.
          </Typography>
        </div>
      </div>
    ) : null}
    </div>
  );
}

export default withTheme(Header);
