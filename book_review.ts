import { encryption, createClient, newSignatureProvider, IClient } from "postchain-client";
import * as readline from "readline";

type Book = {
    isbn: string;
    title: string;
    author: string;
  };

  type BookReview = {
    book: Book;
    reviewer_name: string;
  };
  
  type TxOp = {
    op_name: string;
    op_args: any[];
  };
  
  type TxBody = {
    tx_rid: Buffer;
    ops: TxOp[];
    signers: Buffer[];
  };
  
  type Tx = {
    tx_body: TxBody;
    signatures: Buffer[];
  };

let client: IClient;
const blockchainRID = "5EAF1210AFB7A1D24D218F0ACF16EECCEFF975E39DB3845BB5594F99E090B526";
const privKey = Buffer.from("12853D8AA562CF6C52219B7996478E811D8ABE00E8AA0CC1D8FA2CFD14E6681B", "hex");
const bookKeeperKeyPair = encryption.makeKeyPair(privKey);
const bookKeeperSignatureProvider = newSignatureProvider(bookKeeperKeyPair);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  function getInput(query: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  }
  
  const getReviewsForBook = async (isbn: string) => {
    const bookList = await client.query<BookReview[]>("get_all_reviews_for_book", { isbn: isbn });
    console.log("Book review list\n", bookList);
  };
  
  const getAllTransactions = async () => {
    await client.query<Tx[]>("get_transactions", {}).then((transactions) => {
      transactions.forEach((tx) => {
        console.log("TxRID:", tx.tx_body.tx_rid.toString("hex"));
        tx.tx_body.ops.forEach((op) => {
          console.log("OpName:", op.op_name);
          console.log("OpArgs:", op.op_args);
        });
      });
    });
  
    const transactions = (await client.query("get_transactions", {})) as Tx[];
    transactions.forEach((tx) => {
      console.log("TxRID:", tx.tx_body.tx_rid.toString("hex"));
      tx.tx_body.ops.forEach((op) => {
        console.log("OpName:", op.op_name);
        console.log("OpArgs:", op.op_args);
      });
    });
  };

  
  const getAllBooks = async () => {
    const bookList = await client.query<Book[]>("get_all_books", {});
    console.log("Book list\n", bookList);
  };


async function main() {
    client = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: blockchainRID,
    });
  
    console.log("Creating a new book transactions");
    await client.signAndSendUniqueTransaction(
      { name: "create_book", args: ["ISBN8484848484848", "Chromia 101", "John Doe"] },
      bookKeeperSignatureProvider
    );
    await getInput("Transaction comitted!\npress any key to continue...");
  
    console.log("Let's fetch and view all books currently in the node");
    await getAllBooks();
    await getInput("Press any key to continue...");
  
    console.log("We can now add a second book");
    await client.signAndSendUniqueTransaction(
      { name: "create_book", args: ["ISBN2", "Rell 101", "Jane Doe"] },
      bookKeeperSignatureProvider
    );
    await getInput("Transaction comitted, press any key to continue...");
  
    console.log("Let's fetch and view all books currently in the node");
    await getAllBooks();
    await getInput("Press any key to continue...");
  
    console.log("We can now add two reviews for the book with ISBN = ISBN2");
  
    await client.signAndSendUniqueTransaction(
      {
        name: "create_book_review",
        args: ["ISB5555N2", "Bob Doe", "This is a great book!", 5],
      },
      bookKeeperSignatureProvider
    );
    await client.signAndSendUniqueTransaction(
      {
        name: "create_book_review",
        args: ["ISBN454545452", "Charlie Doe", "It was ok!", 3],
      },
      bookKeeperSignatureProvider
    );
    await getInput("Transaction comitted, press any key to continue...");
  
    console.log("Let's fetch and view all books currently in the node");
    await getReviewsForBook("ISBN2");
    await getInput("Press any key to continue...");
  
    console.log("Now lets look at all transaction that have been commited to the blockchain");
    await getAllTransactions();
    await getInput("Press any key to continue...");
  }

main().catch(err => {
    console.error("Error in main:", err);
});
