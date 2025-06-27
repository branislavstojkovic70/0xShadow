import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task(
  "deploy-shadow",
  "Deploys the ERC6538Registry and ERC5564Announcer contracts"
).setAction(async (_args, hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const RegistryFactory = await hre.ethers.getContractFactory(
    "ERC6538Registry"
  );
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ERC6538Registry deployed at:", registryAddress);

  const AnnouncerFactory = await hre.ethers.getContractFactory(
    "ERC5564Announcer"
  );
  const announcer = await AnnouncerFactory.deploy();
  await announcer.waitForDeployment();
  const announcerAddress = await announcer.getAddress();
  console.log("ERC5564Announcer deployed at:", announcerAddress);
});
