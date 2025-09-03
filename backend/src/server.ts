import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { validateEnvironment, env } from './config/env';
import { emailService } from './utils/email';
import {
    globalErrorHandler,
    notFound,
    requestLogger,
    securityHeaders,
} from './middleware/errorHandler';
import routes from './routes/index';

// Include global Express request augmentation for ts-node compilation (erased in JS)
import type { } from './types/express';

class Server {
    private app: express.Application;
    private port: number;

    constructor() {
        this.app = express();
        this.port = parseInt(env.PORT);

        this.validateEnvironment();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private validateEnvironment(): void {
        console.log('🔍 Validating environment variables...');
        validateEnvironment();
    }

    private setupMiddleware(): void {
        console.log('⚙️  Setting up middleware...');

        // Security and logging middleware
        this.app.use(securityHeaders);
        this.app.use(requestLogger);

        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Trust proxy (useful for deployment)
        this.app.set('trust proxy', 1);
    }

    private setupRoutes(): void {
        console.log('🛣️  Setting up routes...');

        // Mount all routes
        this.app.use(routes);
    }

    private setupErrorHandling(): void {
        console.log('🛡️  Setting up error handling...');

        // Handle undefined routes
        this.app.use(notFound);

        // Global error handler (must be last)
        this.app.use(globalErrorHandler);
    }

    private async connectToDatabase(): Promise<void> {
        console.log('🗃️  Connecting to database...');
        await connectDatabase();
    }

    private async verifyEmailService(): Promise<void> {
        console.log('📧 Verifying email service...');
        try {
            await emailService.verifyConnection();
        } catch (error) {
            console.warn('⚠️  Email service verification failed. Email features may not work properly.');
        }
    }

    public async start(): Promise<void> {
        try {
            console.log('🚀 Starting Note App Server...');
            console.log(`📦 Node.js version: ${process.version}`);
            console.log(`🌍 Environment: ${env.NODE_ENV}`);

            // Connect to database
            await this.connectToDatabase();

            // Verify email service
            await this.verifyEmailService();

            // Start the server
            const server = this.app.listen(this.port, () => {
                console.log('✅ Server started successfully!');
                console.log(`🌐 Server running on port ${this.port}`);
                console.log(`📍 API available at: http://localhost:${this.port}/api`);
                console.log(`🏥 Health check at: http://localhost:${this.port}/api/health`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            });

            // Graceful shutdown handling
            this.setupGracefulShutdown(server);

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    private setupGracefulShutdown(server: any): void {
        const gracefulShutdown = async (signal: string) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

            try {
                // Close server
                server.close(async () => {
                    console.log('📴 HTTP server closed');

                    try {
                        // Close database connection
                        console.log('🗃️  Closing database connection...');
                        // Database connection will be closed by the disconnect handler in database.ts

                        console.log('✅ Graceful shutdown complete');
                        process.exit(0);
                    } catch (error) {
                        console.error('❌ Error during shutdown:', error);
                        process.exit(1);
                    }
                });

                // Force close after timeout
                setTimeout(() => {
                    console.error('❌ Forced shutdown due to timeout');
                    process.exit(1);
                }, 10000); // 10 seconds

            } catch (error) {
                console.error('❌ Error during graceful shutdown:', error);
                process.exit(1);
            }
        };

        // Handle different shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }

    // Method to get Express app (useful for testing)
    public getApp(): express.Application {
        return this.app;
    }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
    console.error('💥 Fatal error starting server:', error);
    process.exit(1);
});

export default server;
