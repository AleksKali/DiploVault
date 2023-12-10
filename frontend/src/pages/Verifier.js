import Container from "react-bootstrap/Container";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk, { waitForConfirmation } from "algosdk";
import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Form from 'react-bootstrap/Form';

import "./Verifier.css";
import "../App.css";

const peraWallet = new PeraWalletConnect();

const appIndex = 312585748;
const appAddress = "VZV453MRMXJLH4EDNEVQ2WF3ST53Z7PSQDHR6NILH7SZCMYE6CEGLD3NPE";

const algod = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  443
);

function Verifier() {
  const [show, setShow] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

  const [accountAddress, setAccountAddress] = useState(null);
  const isConnectedToPeraWallet = !!accountAddress;
  const [verificationResult, setVerificationResult] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const certificateCIDRef = useRef(null);

  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector.on("disconnect", handleDisconnectWalletClick);
        console.log(accounts);
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  return (
    <Container className="verifier">
      <div className="first">
        <div className="first-col">
          <button
            className="connect btn"
            onClick={
              isConnectedToPeraWallet
                ? handleDisconnectWalletClick
                : handleConnectWalletClick
            }
          >
            {isConnectedToPeraWallet ? "Disconnect" : "Connect to Wallet"}
          </button>
        </div>
        <div className="first-col">
        {!buttonClicked && (<button className="optin btn" onClick={() => optInRpsApp()}>
            Opt-In
          </button>)}
        </div>
      </div>
      <br />
      <div className="third">
      {show === false ? (<div className="second-col">
          <Form.Label htmlFor="inputCID" style={{ fontWeight: 'bold' }}>Enter IPFS CID of the certificate:</Form.Label>
          <Form.Control
          type="plaintext"
          id="inputCID"
          ref={certificateCIDRef}
      />
          <button
            className="btn"
            aria-controls="example-fade-text"
            onClick={handleVerifyCertificateClick}
            id="verify-button"
          >
            Verify Certificate
          </button>
        </div>) :
        (
          <div className="data">
            <h4>Verification result:</h4>
            <h3>Certificate is {verificationResult}.</h3>
          </div>
        )}
        {showUrl === true ? (
          <div className="data">
          <h4>Link to IPFS:</h4>
          <a href={fileUrl}>
          <h3>{fileUrl}</h3>
          </a></div>) : null }
      </div>
    </Container>
  );

  function handleConnectWalletClick() {
    peraWallet
      .connect()
      .then((newAccounts) => {
        peraWallet.connector.on("disconnect", handleDisconnectWalletClick);
        setAccountAddress(newAccounts[0]);
      })
      .catch((error) => {
        if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
          console.log(error);
        }
      });
  }

  function handleDisconnectWalletClick() {
    peraWallet.disconnect();
    setAccountAddress(null);
  }

  async function handleVerifyCertificateClick(){
    await verifyCertificate(certificateCIDRef.current.value);
  }

  async function optInRpsApp() {
    try {
      setButtonClicked(true);

      const suggestedParams = await algod.getTransactionParams().do();

      const actionTx = algosdk.makeApplicationOptInTxn(
        accountAddress,
        suggestedParams,
        appIndex
      );

      const actionTxGroup = [{ txn: actionTx, signers: [accountAddress] }];

      const signedTx = await peraWallet.signTransaction([actionTxGroup]);
      
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      const result = await waitForConfirmation(algod, txId, 2);
      console.log(result);
    } catch (e) {
      console.error(`There was an error calling the app: ${e}`);
    }
  }

  async function verifyCertificate(
    certificateCID
  ) 
  {
    try {
      const suggestedParams = await algod.getTransactionParams().do();
      const appArgs = [
        new Uint8Array(Buffer.from("verify")),
        new Uint8Array(Buffer.from(certificateCID)),
      ];

      const accounts = [
        "6HJ53BZ6IUNZPRJDPOI4TXLW3BUW6PC5N7CAVBSO4RZ7JMBOEBGGK646JE",
      ];

      let actionTx = algosdk.makeApplicationNoOpTxn(
        accountAddress,
        suggestedParams,
        appIndex,
        appArgs,
        accounts
      );

      let payTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: accountAddress,
        to: appAddress,
        amount: 50000,
        suggestedParams: suggestedParams,
      });

      let txns = [actionTx, payTx];
      algosdk.assignGroupID(txns);

      const actionTxGroup = [
        { txn: actionTx, signers: [accountAddress] },
        { txn: payTx, signers: [accountAddress] },
      ];

      const signedTxns = await peraWallet.signTransaction([actionTxGroup]);

      console.log(signedTxns);
      const { txId } = await algod.sendRawTransaction(signedTxns).do();
      const result = await waitForConfirmation(algod, txId, 4);
      console.log(result);

      var localStateDelta = result['local-state-delta'];
      
      const firstItem = localStateDelta[0];
      const targetKey = 'dmVyaWZpY2F0aW9uX3Jlc3VsdA==';
      const targetDeltaItem = firstItem.delta.find(item => item.key === targetKey);
      
      if (targetDeltaItem) {
        console.log('Stored Data:', targetDeltaItem.value);

        setShow(true);
        const cid = certificateCIDRef.current.value;
        const bytesValue = targetDeltaItem.value.bytes;

        if (bytesValue === btoa("valid")) {
          const fileUrl = `https://skywalker.infura-ipfs.io/ipfs/${cid}`;
          setFileUrl(fileUrl);
          setVerificationResult("valid");
          setShowUrl(true);
        } else {
          setVerificationResult("invalid");
        }
      } else {
        console.log('Data not found.');
      }
    } catch (e) {
      console.error(`There was an error calling the app: ${e}`);
    }
  }
}
export default Verifier;