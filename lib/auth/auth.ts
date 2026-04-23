// import { betterAuth } from "better-auth";
// import { mongodbAdapter } from "better-auth/adapters/mongodb";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import { initializeUserBoard } from "../init-user-board";
// import connectDB from "../db";

// const mongooseInstance = await connectDB();
// const client = mongooseInstance.connection.getClient();
// const db = client.db();

// export const auth = betterAuth({
//   database: mongodbAdapter(db, {
//     client,
//   }),
//   session: {
//     cookieCache: {
//       enabled: true,
//       maxAge: 60 * 60,
//     },
//   },
//   emailAndPassword: {
//     enabled: true,
//   },
//   databaseHooks: {
//     user: {
//       create: {
//         after: async (user) => {
//           if (user.id) {
//             await initializeUserBoard(user.id);
//           }
//         },
//       },
//     },
//   },
// });

// export async function getSession() {
//   const result = await auth.api.getSession({
//     headers: await headers(),
//   });

//   return result;
// }

// export async function signOut() {
//   const result = await auth.api.signOut({
//     headers: await headers(),
//   });

//   if (result.success) {
//     redirect("/sign-in");
//   }
// }


// import { betterAuth } from "better-auth";
// import { mongodbAdapter } from "better-auth/adapters/mongodb";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import { initializeUserBoard } from "../init-user-board";
// import { MongoClient } from "mongodb";

// const client = new MongoClient(process.env.MONGODB_URI!);
// await client.connect();
// const db = client.db();

// export const auth = betterAuth({
//   database: mongodbAdapter(db, {
//     client,
//   }),
//   session: {
//     cookieCache: {
//       enabled: true,
//       maxAge: 60 * 60,
//     },
//   },
//   emailAndPassword: {
//     enabled: true,
//   },
//   databaseHooks: {
//     user: {
//       create: {
//         after: async (user) => {
//           if (user.id) {
//             await initializeUserBoard(user.id);
//           }
//         },
//       },
//     },
//   },
// });

// export async function getSession() {
//   const result = await auth.api.getSession({
//     headers: await headers(),
//   });

//   return result;
// }

// export async function signOut() {
//   const result = await auth.api.signOut({
//     headers: await headers(),
//   });

//   if (result.success) {
//     redirect("/sign-in");
//   }
// } 


import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { initializeUserBoard } from "../init-user-board";
import { MongoClient } from "mongodb";

let client: MongoClient;
let db: any;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

async function getDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI as string);
    // client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  }
  return { client, db };
}

const { client: dbClient, db: database } = await getDB();

export const auth = betterAuth({
  database: mongodbAdapter(database, {
    client: dbClient,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.id) {
            await initializeUserBoard(user.id);
          }
        },
      },
    },
  },
});

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  return result;
}

export async function signOut() {
  const result = await auth.api.signOut({
    headers: await headers(),
  });

  if (result.success) {
    redirect("/sign-in");
  }
}