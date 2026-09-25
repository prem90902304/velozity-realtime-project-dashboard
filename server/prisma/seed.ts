import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  await db.notification.deleteMany();
  await db.activityLog.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.client.deleteMany();
  await db.refreshToken.deleteMany();
  await db.user.deleteMany();

  const pw = await bcrypt.hash('Password123!', 10);

  const admin = await db.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash: pw,
      role: Role.ADMIN,
    },
  });

  const pm1 = await db.user.create({
    data: {
      name: 'Ravi Kumar',
      email: 'pm1@demo.com',
      passwordHash: pw,
      role: Role.PM,
    },
  });

  const pm2 = await db.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'pm2@demo.com',
      passwordHash: pw,
      role: Role.PM,
    },
  });

  const devs = [];

  for (const [i, name] of ['Arun', 'Meena', 'Karthik', 'Divya'].entries()) {
    devs.push(
      await db.user.create({
        data: {
          name: `${name} Developer`,
          email: `dev${i + 1}@demo.com`,
          passwordHash: pw,
          role: Role.DEVELOPER,
        },
      }),
    );
  }

  const clients = [];

  for (let i = 1; i <= 3; i++) {
    clients.push(
      await db.client.create({
        data: {
          name: `Client ${i}`,
          email: `client${i}@example.com`,
        },
      }),
    );
  }

  const pms = [pm1, pm2, pm1];
  const projects = [];

  for (let p = 0; p < 3; p++) {
    const project = await db.project.create({
      data: {
        name: `Project ${p + 1}`,
        description: 'Seeded agency project',
        creatorId: pms[p].id,
        clientId: clients[p].id,
      },
    });

    projects.push(project);

    const statuses = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.IN_REVIEW,
      TaskStatus.DONE,
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
    ];

    const priorities = [
      Priority.CRITICAL,
      Priority.HIGH,
      Priority.MEDIUM,
      Priority.LOW,
      Priority.HIGH,
      Priority.MEDIUM,
    ];

    for (let t = 0; t < 6; t++) {
      const daysOffset =
        t === 0 ? -3 :
        t === 1 ? -1 :
        t + 2;

      const due = new Date(
        Date.now() + daysOffset * 86400000,
      );

      const developer = devs[(p + t) % 4];

      const task = await db.task.create({
        data: {
          title: `Task ${p + 1}.${t + 1}`,
          description: 'Seed task for assessment',
          projectId: project.id,
          developerId: developer.id,
          status: statuses[t],
          priority: priorities[t],
          dueDate: due,
        },
      });

      await db.activityLog.create({
        data: {
          message: `${pms[p].name} created ${task.title}`,
          userId: pms[p].id,
          projectId: project.id,
          taskId: task.id,
          fromStatus: null,
          toStatus:
            task.status === TaskStatus.DONE
              ? TaskStatus.DONE
              : null,
        },
      });

      if (t === 0) {
        await db.notification.create({
          data: {
            userId: developer.id,
            taskId: task.id,
            message: `You were assigned ${task.title}`,
          },
        });
      }
    }
  }

  console.log('Seeded demo users.');
  console.log('Password: Password123!');
  console.log(
    'Admin: admin@demo.com | PMs: pm1@demo.com / pm2@demo.com | Developers: dev1@demo.com ... dev4@demo.com',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
