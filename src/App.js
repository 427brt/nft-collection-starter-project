// App.js
import "./styles/App.css";

// フロントエンドとコントラクトを連携するライブラリをインポートします。
import { ethers } from "ethers";
// useEffect と useState 関数を React.js からインポートしています。
import React, { useEffect, useState } from "react";

//import twitterLogo from "./assets/twitter-logo.svg";
import githubLogo from "./assets/github-logo.svg";
import myEpicNft from "./utils/MyEpicNFT.json";

const TWITTER_HANDLE = "";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const GITHUB_HANDLE = "427brt";
const GITHUB_LINK = `https://github.com/${GITHUB_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;

// コトントラクトアドレスをCONTRACT_ADDRESS変数に格納
const CONTRACT_ADDRESS = "0xe1514301e92b3cea2b73DC2185E886811Aa95652"; //再デプロイ時に変更必要 -> abiファイルの更新

const App = () => {
  // ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
  const [currentAccount, setCurrentAccount] = useState("");
  //ミント回数を格納する為の状態変数を定義
  const [mintCount, setMintCount] = useState(0);
  //ローディングアニメーション
  const [loading, setLoading] = useState(true);
  //ネットワークの確認
  const [isNetwork, setIsNetwork] = useState(false);
  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。
            NFT へのリンクはこちらです: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ユーザーが認証可能なウォレットアドレスを持っているか確認します。
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // ユーザーが認証可能なウォレットアドレスを持っている場合は、ユーザーに対してウォレットへのアクセス許可を求める。許可されれば、ユーザーの最初のウォレットアドレスを accounts に格納する。
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      //networkの確認
      let chainId = await ethereum.request({method : "eth_chainId"});
      console.log("Connected to chain " + chainId);
      //goerliのIDは5
      const goerliChainId = "0x5";
      if(chainId !== goerliChainId) {
        setIsNetwork(false);
        alert("Goerilテストネットワークに接続してください!");
      }
      if(chainId === goerliChainId) {
        setIsNetwork(true);
      }

      // イベントリスナーを設定
      // この時点で、ユーザーはウォレット接続が済んでいます。
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  // connectWallet メソッドを実装します。
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // ウォレットアドレスに対してアクセスをリクエストしています。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);

      // ウォレットアドレスを currentAccount に紐付けます。
      setCurrentAccount(accounts[0]);

      // イベントリスナーを設定
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // NFT を Mint する関数を定義しています。
  const askContractToMintNft = async () => {
    try {
      //ローディング中
      setLoading(true);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );
        //ローディング中解除
        setLoading(false);
      } else {
        setLoading(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  // ページがロードされた際に下記が実行されます。
  useEffect(() => {
    setLoading(true);
    checkIfWalletIsConnected();
    getMintCount();
    setLoading(false);
  }, []);

  // renderNotConnectedContainer メソッド（ Connect to Wallet を表示する関数）を定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  // Mint NFT ボタンをレンダリングするメソッドを定義します。
  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
      disabled={!isNetwork}
    >
      Mint NFT
    </button>
  );

  const getMintCount = async () => {
    try {
      const {ethereum} = window;

      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        let number = await connectedContract.TotalMintCount();
        if(!number) return;
        setMintCount(number.toNumber() - 1);
      } else {
        console.log("Doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {/*条件付きレンダリング。
          // すでにウォレット接続されている場合は、
          // Mint NFT を表示する。*/}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}

          {!isNetwork ? (
            <p className="sub-text animate-pluse text-orange-500">
              You are not in Goerli Network.
            </p>
          ) : (
            <p className="sub-text text-green-500">
              
            </p>
          )}

          {loading ? (
            <p className="sub-text animate-pluse text-green-500">
              Loading...
            </p>
          ) : (
            <p className="sub-text text-blue-500">
              
            </p>
          )}
        </div>
        <div className="footer-container">
          <img alt="GitHub Logo" className="github-logo" src={githubLogo} />
          <a
            className="footer-text"
            href={GITHUB_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${GITHUB_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;