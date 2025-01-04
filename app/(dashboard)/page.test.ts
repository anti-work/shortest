import { shortest } from "@antiwork/shortest";

const loginEmail = `shortest@${process.env.MAILOSAUR_SERVER_ID}.mailosaur.net`;
if (!loginEmail) throw new Error("MAILOSAUR_LOGIN_EMAIL is required");

shortest("Verify that buttons on the landing page are rounded");
shortest("Log in", { email: loginEmail });
shortest("Verify that the user can access the /dashboard page");
