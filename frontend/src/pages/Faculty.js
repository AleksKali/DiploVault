import Container from "react-bootstrap/Container";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk, { waitForConfirmation } from "algosdk";
import { useEffect, useState, useRef, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Form from 'react-bootstrap/Form';
import "./Faculty.css";
import "../App.css";
import { create as ipfsHttpClient } from "ipfs-http-client";

const projectId = process.env.REACT_APP_PROJECT_ID;
const projectSecretKey = process.env.REACT_APP_PROJECT_KEY;
const authorization = "Basic " + btoa(projectId + ":" + projectSecretKey);

const peraWallet = new PeraWalletConnect();

const appIndex = 312585748;


const algod = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  443
);

function Faculty() {
  const [show, setShow] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [triggerEffect, setTriggerEffect] = useState(false);

  const [accountAddress, setAccountAddress] = useState(null);
  const isConnectedToPeraWallet = !!accountAddress;

  const studentIdRef = useRef(null);
  const studentNameRef = useRef(null);
  const certificateIdRef = useRef(null);
  const issueDateRef = useRef(new Date());
  const certificateFileRef = useRef(null);

  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileCID, setUploadedFileCID] = useState(null);

  const ipfs = ipfsHttpClient({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization,
    },
  });

  const issueCertificate = useCallback(
    async (certificateId, studentId, studentName, issueDate) => {
      try {
      console.log("Issue certificate function.");
      
      console.log(uploadedFileCID);
      console.log(uploadedFileUrl);

      const suggestedParams = await algod.getTransactionParams().do();
      const appArgs = [
        new Uint8Array(Buffer.from("issue")),
        new Uint8Array(Buffer.from(certificateId)),
        new Uint8Array(Buffer.from(studentId)),
        new Uint8Array(Buffer.from(studentName)),
        new Uint8Array(Buffer.from(issueDate)),
        new Uint8Array(Buffer.from(uploadedFileCID))
      ];

      setTriggerEffect(false);

      let actionTx = algosdk.makeApplicationNoOpTxn(
        accountAddress,
        suggestedParams,
        appIndex,
        appArgs
      );

      const actionTxGroup = [{ txn: actionTx, signers: [accountAddress] }];
      
      const signedTxns = await peraWallet.signTransaction([actionTxGroup]);

      const { txId } = await algod.sendRawTransaction(signedTxns).do();
      const result = await waitForConfirmation(algod, txId, 4);
      console.log(result);

    } catch (e) {
      console.error(`There was an error calling the app: ${e}`);
    }
  }, [accountAddress, uploadedFileCID, uploadedFileUrl]);

  useEffect(() => {
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        peraWallet.connector.on("disconnect", handleDisconnectWalletClick);
        console.log(accounts);
        if (accounts.length) {
          setAccountAddress(accounts[0]);
          console.log("we are setting account address");
        }
      })
      .catch((e) => console.log(e));
  }, []);

  useEffect(() => {
    if (triggerEffect) {
      const formattedIssueDate = formatDate(new Date(issueDateRef.current.value));
      issueCertificate(
        certificateIdRef.current.value,
        studentIdRef.current.value,
        studentNameRef.current.value,
        formattedIssueDate
      )
        .then(() => setShow(true))
        .catch(error => console.error("Error issuing certificate:", error));
    }
  }, [triggerEffect, issueCertificate]);
  
  return (
    <Container className="faculty">
      <div className="first-faculty">
        <div>
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
        <div>
        {!buttonClicked && (<button className="optin btn" onClick={() => optInRpsApp()}>
            Opt-In
          </button>)}
        </div>
      </div>
      {ipfs ? (
       show === true ? (
       <div className="data">
       <h6>Link to IPFS:</h6>
       <a href={uploadedFileUrl}>
       <h5>{uploadedFileUrl}</h5>
       </a>
       <br/>
       <h6>Uploaded file CID:</h6>
       <h5>{uploadedFileCID}</h5>
     </div>
     ) : (
      <div className="second-col">
        <div className="form">
        <Form.Group className="mb-3">
        <Form.Label htmlFor="inputStudentId">Student ID:</Form.Label>
          <Form.Control
          type="plainText"
          id="inputStudentId"
          ref={studentIdRef}
      />
        </Form.Group>
       <Form.Group className="mb-3">
       <Form.Label htmlFor="inputStudentName">Student Full Name:</Form.Label>
          <Form.Control
          type="plainText"
          id="inputStudentName"
          ref={studentNameRef}
      />
       </Form.Group>
      <Form.Group className="mb-3">
      <Form.Label htmlFor="inputCertificateId">Certificate ID:</Form.Label>
          <Form.Control
          type="plainText"
          id="inputCertificateId"
          ref={certificateIdRef}
      />
      </Form.Group>
      <Form.Group className="mb-3">
      <Form.Label htmlFor="inputIssueDate">Issue Date of the Certificate:</Form.Label>
          <Form.Control
          type="date"
          id="inputIssueDate"
          ref={issueDateRef}
      />
      </Form.Group>
      <Form.Group controlId="formFile" className="mb-3">
        <Form.Label>Certificate File:</Form.Label>
        <Form.Control 
        type="file"
        ref={certificateFileRef}
        />
      </Form.Group>
      </div>
      <button
        className="btn"
        id="issue-certificate-button"
        aria-controls="example-fade-text"
        onClick={handleIssueCertificateClick}
      >
        Issue Certificate
      </button>
      </div>
      )
      ) : null}
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

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

  async function handleIssueCertificateClick(){
    console.log("HandleIssueCertificateClick function");

    await uploadFileToIpfs();

    const formattedIssueDate = formatDate(new Date(issueDateRef.current.value));

    setTriggerEffect(true);

    await issueCertificate(
      certificateIdRef.current.value,
      studentIdRef.current.value,
      studentNameRef.current.value,
      formattedIssueDate
    );

    setShow(true);
  }

  async function uploadFileToIpfs(){
    try {
      const file = certificateFileRef.current.files[0];

      if (!file) {
        return alert("No file selected");
      }

      const result = await ipfs.add(file);
      console.log(result);
      console.log(result.cid);
      console.log(result.path);

      const url = `https://skywalker.infura-ipfs.io/ipfs/${result.path}`;
      setUploadedFileUrl(url);

      const cid = result.cid.toString();
      setUploadedFileCID(cid);

    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Failed to upload file");
    }
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
      console.log(signedTx);
      const { txId } = await algod.sendRawTransaction(signedTx).do();
      const result = await waitForConfirmation(algod, txId, 2);
      console.log(result);
    } catch (e) {
      console.error(`There was an error calling the app: ${e}`);
    }
  }
}
export default Faculty;