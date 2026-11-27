import { defineConfig } from "vitest/config";

// carrega o .env para os testes de integracao (se existir)
try {
    process.loadEnvFile(".env");
} catch {}

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        // os testes de integracao usam o mesmo banco, entao rodam um de cada vez
        fileParallelism: false,
        testTimeout: 15000,
        // a limpeza do banco no final de cada arquivo faz varias requisicoes
        hookTimeout: 60000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/server.ts", "src/config/**"],
            reporter: ["text", "html"],
            thresholds: {
                lines: 60,
                statements: 60,
                functions: 60,
                branches: 60,
            },
        },
    },
});
