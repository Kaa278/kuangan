import { prisma } from './src/lib/prisma';

async function main() {
    const txs = await prisma.transaction.findMany({ where: { store: 'BreadTalk' } });
    if (txs.length > 0) {
        const updated = await prisma.transaction.update({
            where: { id: txs[0].id },
            data: { date: new Date() }
        });
        console.log("Updated Transaction:", updated);
    } else {
        console.log("No BreadTalk transaction found.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
