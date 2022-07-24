import supertest from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/db.js";
import * as userFactory from "./factories/userFactory.js";
import * as testFactory from "./factories/testFactory.js";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE blacklist CASCADE`;
});

describe("User tests suite", () => {
  it("given email and password, create user", async () => {
    const login = userFactory.createLogin();
    const response = await supertest(app).post(`/sign-up`).send(login);
    expect(response.status).toBe(201);

    const user = await prisma.users.findFirst({
      where: { email: login.email },
    });
    expect(user.email).toBe(login.email);
  });

  it("given valid email and password, receive token", async () => {
    const login = userFactory.createLogin();
    const user: any = await userFactory.createUser(login);

    const response = await supertest(app).post(`/sign-in`).send({
      email: user.email,
      password: user.plainPassword,
    });
    const token = response.body.token;
    expect(token).not.toBeNull();
  });

  it("given email and password already in use, receive 409", async () => {
    const login = userFactory.createLogin();
    await userFactory.createUser(login);

    const response = await supertest(app).post(`/sign-up`).send(login);
    expect(response.status).toBe(409);
  });

  it("given invalid password, receive 401", async () => {
    const login = userFactory.createLogin();
    await userFactory.createUser(login);

    const response = await supertest(app)
      .post(`/sign-in`)
      .send({ ...login, password: "wrong password" });
    expect(response.status).toBe(401);
  });

  it("given email not registered, receive 404", async () => {
    const login = userFactory.createLogin();

    const response = await supertest(app).post(`/sign-in`).send(login);
    expect(response.status).toBe(404);
  });
});

describe("Tests tests suite", () => {
  it("given name, pdfUrl, categoryId, teacherId, disciplineId, create test", async () => {
    const login = userFactory.createLogin();
    await userFactory.createUser(login);
    let response = await supertest(app).post(`/sign-in`).send(login);
    const token = response.body.token;

    const testBody = testFactory.testBody();
    const { name, pdfUrl, categoryId, teacherId, disciplineId } = testBody;
    response = await supertest(app)
      .post(`/test`)
      .send({
        name,
        pdfUrl,
        categoryId,
        teacherId,
        disciplineId,
      })
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(201);

    const test = await prisma.tests.findFirst({
      where: { name, pdfUrl, categoryId, teacherId, disciplineId },
    });
    expect(testBody.name).toBe(test.name);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});