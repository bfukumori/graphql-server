import { findOrCreateCart } from "../lib/cart";
import { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    cart: async (_, { id }, { prisma }) => {
      return await findOrCreateCart(prisma, id);
    },
  },
  Cart: {
    items: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();
      return items;
    },
    totalItems: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();
      return items.reduce((total, item) => total + item.quantity || 1, 0);
    },
    subtotal: async ({ id }, _, { prisma }) => {
      const items = await prisma.cart
        .findUnique({
          where: { id },
        })
        .items();

      const amount = items.reduce(
        (total, item) => total + item.quantity * item.price ?? 0,
        0
      );

      return {
        amount,
        formatted: Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount),
      };
    },
  },
  CartItem: {
    unitTotal: (item) => {
      const amount = item.price;
      return {
        amount,
        formatted: Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount),
      };
    },
    lineTotal: (item) => {
      const amount = item.price * item.quantity;
      return {
        amount,
        formatted: Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount),
      };
    },
  },
  Mutation: {
    addItem: async (_, { input }, { prisma }) => {
      const cart = await findOrCreateCart(prisma, input.cartId);
      await prisma.cartItem.upsert({
        create: {
          cartId: cart.id,
          name: input.name,
          price: input.price,
          quantity: input.quantity || 1,
          description: input.description,
          image: input.image,
          id: input.id,
        },
        where: {
          id_cartId: {
            id: input.id,
            cartId: cart.id,
          },
        },
        update: {
          quantity: {
            increment: input.quantity || 1,
          },
        },
      });
      return cart;
    },
    removeItem: async (_, { input }, { prisma }) => {
      const { cartId } = await prisma.cartItem.delete({
        where: {
          id_cartId: {
            id: input.id,
            cartId: input.cartId,
          },
        },
        select: {
          cartId: true,
        },
      });
      return findOrCreateCart(prisma, cartId);
    },
    increaseCartItem: async (_, { input }, { prisma }) => {
      const { cartId } = await prisma.cartItem.update({
        data: {
          quantity: {
            increment: 1,
          },
        },
        where: {
          id_cartId: {
            id: input.id,
            cartId: input.cartId,
          },
        },
        select: {
          cartId: true,
        },
      });
      return findOrCreateCart(prisma, cartId);
    },
    decreaseCartItem: async (_, { input }, { prisma }) => {
      const { cartId, quantity } = await prisma.cartItem.update({
        data: {
          quantity: {
            decrement: 1,
          },
        },
        where: {
          id_cartId: {
            id: input.id,
            cartId: input.cartId,
          },
        },
        select: {
          cartId: true,
          quantity: true,
        },
      });
      if (quantity <= 0) {
        await prisma.cartItem.delete({
          where: {
            id_cartId: {
              id: input.id,
              cartId: input.cartId,
            },
          },
        });
      }
      return findOrCreateCart(prisma, cartId);
    },
  },
};
