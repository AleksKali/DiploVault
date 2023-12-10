import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk, {waitForConfirmation} from "algosdk";

const peraWallet = new PeraWalletConnect();

const appIndex = 286341972; //kad kreiramo app onaj njen id sto dobijemo
const appAddress = "JD54NMC25EELPX7KSYHAHTO7GVDNLUUREAXNG3BECDXJVLX42U4NOGYY4M"; //app account 

const algod = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  443
)

function App() {
  return ( //moze da vraca samo jednu komponentu, to je ovaj container, sve u njega stavljaj
    <Container> 
      <h1>Let's do this shit!!!</h1>
      <Row>
        <Col>
        <Button>OptIn</Button>
        </Col>
        <Col>
        <Button onClick={handleConnect}>Connect</Button>
        </Col>
      </Row> 
      <br/>
    </Container>
  );

  function handleConnect(){
    peraWallet.connect();
  }
}

export default App;
