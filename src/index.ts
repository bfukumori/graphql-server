import { ApolloServer } from "apollo-server";
import { readFileSync } from "fs";
import { join } from "path";

import type { PrismaClient } from "@prisma/client";

import { resolvers } from "./graphql/resolvers";
import prisma from "./lib/prisma";

export type GraphQLContext = {
  prisma: PrismaClient;
};

const typeDefs = readFileSync(join(__dirname, "/graphql/schema.graphql"), {
  encoding: "utf-8",
});

export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: "bounded",
  context: () => createContext(),
});

async function startServer() {
  const { url } = await server.listen();
  console.log(`Server ready at ${url}`);
}
startServer();
