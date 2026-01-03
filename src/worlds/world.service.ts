import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { CreateWorldDto } from "./dto/createWorld.dto";
import { GetWorldsDto } from "./dto/getWords.dto";

// DB Stuff 
import { db, worlds, NewWorld, World, assets } from "../db";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";

@Injectable()
export class WorldService {
    private readonly logger = new Logger(WorldService.name);

    async createWorld(createWorldDto: CreateWorldDto, userId: string): Promise<{ world: World, message: string }> {
        const { name, description, systemId = 0, settings = {}, coverImageId = null } = createWorldDto;

        this.logger.log(`Creating world: ${name} for user: ${userId}`);

        const newWorld: NewWorld = {
            name,
            description,
            systemId: 0,
            settings,
            coverImageId,
            ownerId: userId,
            createdAt: new Date(),
        };

        try {
            const [world] = await db.insert(worlds).values(newWorld).returning();
            return { world, message: 'World created successfully' };
        } catch (error) {
            this.logger.error(`Error creating world: ${name} for user: ${userId}`, error);
            throw new InternalServerErrorException('Error creating world');
        }

    }

    async getWorlds(userId: string, query: GetWorldsDto = {}): Promise<{ worlds: World[], message: string }> {
        const {
            page = 1,
            limit = 10,
            systemId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        this.logger.log(`Getting worlds for user: ${userId}`, { page, limit, systemId, search, sortBy, sortOrder });

        try {
            // Build where conditions
            const conditions = [eq(worlds.ownerId, userId)];

            if (systemId !== undefined) {
                conditions.push(eq(worlds.systemId, systemId));
            }

            if (search) {
                conditions.push(like(worlds.name, `%${search}%`));
            }

            // Build order by
            const orderByColumn = worlds[sortBy];
            const orderBy = sortOrder === 'asc' 
                ? asc(orderByColumn)
                : desc(orderByColumn);

            // Query with pagination
            const offset = (page - 1) * limit;
            
            const userWorlds = await db
                .select()
                .from(worlds)
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(limit)
                .offset(offset);

            this.logger.log(`Found ${userWorlds.length} worlds for user: ${userId}`);
            return { worlds: userWorlds as World[], message: 'Worlds fetched successfully' };
        } catch (error) {
            this.logger.error(`Error getting worlds for user: ${userId}`, error);
            throw new InternalServerErrorException('Error getting worlds');
        }
    }

    async deleteWorld(id: string, userId: string): Promise<{ message: string }> {
        this.logger.log(`Deleting world: ${id} for user: ${userId}`);

        try {
            await db.delete(worlds).where(and(eq(worlds.id, id), eq(worlds.ownerId, userId)));
            await db.delete(assets).where(eq(assets.worldId, id));
            return { message: 'World deleted successfully' };
        } catch (error) {
            this.logger.error(`Error deleting world: ${id} for user: ${userId}`, error);
            throw new InternalServerErrorException('Error deleting world');
        }
    }
}
