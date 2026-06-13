import { program } from 'commander'
import { modelCommand } from './commands/models'
import { agentCommand } from './commands/agent'
import { providerCommand } from './commands/providers'




program
    .name("gk")
    .description('coding agent cli')
    .version('0.1.0')
    .addCommand(modelCommand)
    .addCommand(agentCommand)
    .addCommand(providerCommand)
program.parse()
