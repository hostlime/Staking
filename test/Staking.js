const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let staking, myToken, lpToken;
  let rewarPool = 999;
  let tokenPool = 10_000 * 10 ** 18;
  let approveToken = 55;

  let _1minute = 60; // 1 минута
  let rewardProc = 20; // Процент наград за стейкинг
  let rewardStakingTime = 10 * _1minute; // время спустя которое начисляются реварды
  let withdrawStakingTime = 20 * _1minute; // время спустя которое доступен вывод ревардов

  // создаём экземпляры контракта
  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // контракт токенов с первой недели
    const MyToken = await ethers.getContractFactory("MyERC20");
    myToken = await MyToken.deploy();
    await myToken.deployed();

    // контракт токенов с первой недели
    const LpToken = await ethers.getContractFactory("LpERC20");
    lpToken = await LpToken.deploy();
    await lpToken.deployed();

    // контракт стейкинга
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(lpToken.address, myToken.address);
    await staking.deployed();

    // Переводим на контракт стейкинга токены для раздачи наград
    await myToken.transfer(staking.address, rewarPool);
  });

  it("Checking staking contract has reward pool", async function () {
    expect(await myToken.balanceOf(staking.address)).to.be.equal(rewarPool);
  });

  it("Checking LpToken has tokens", async function () {
    const ownerBalance = await lpToken.balanceOf(owner.address);
    expect(await lpToken.totalSupply()).to.be.equal(ownerBalance);
  });

  // Провекрка что менять настройки стейкинга может только админ
  it("checking that change setting pool can only an owner", async function () {
    // меняем конфигураци не от админа
    await expect(
      staking.connect(addr1).changeSetting(1, 1, 1)
    ).to.be.revertedWith("AccessControl:");

    // меняем от админа на 101% наград для проверки require
    await expect(
      staking.connect(owner).changeSetting(101, 1, 1)
    ).to.be.revertedWith("reward must be from 0 to 100 percent");

    expect(await staking.rewardProc()).to.be.equal(rewardProc);
    expect(await staking.rewardStakingTime()).to.be.equal(rewardStakingTime);
    expect(await staking.withdrawStakingTime()).to.be.equal(
      withdrawStakingTime
    );

    // Меняем параметры стейкинга
    await staking.changeSetting(
      rewardProc + 1,
      rewardStakingTime + 2,
      withdrawStakingTime + 3
    );
    // Проверяем изменение параметров тейкинга
    expect(await staking.rewardProc()).to.be.equal(rewardProc + 1);
    expect(await staking.rewardStakingTime()).to.be.equal(
      rewardStakingTime + 2
    );
    expect(await staking.withdrawStakingTime()).to.be.equal(
      withdrawStakingTime + 3
    );
  });

  it("checking that can't stake `0`", async function () {
    await expect(staking.stake(0)).to.be.revertedWith(
      "it is not enought for stake"
    );
  });
  // Провекрка что нельзя разстейкать токены если ранее не стейкал
  it("checking that can't unstake if you have't stake", async function () {
    await expect(staking.unstake()).to.be.revertedWith(
      "you dont have stake lpTokens"
    );
  });
  // Провекрка что нельзя разстейкать токены если ранее не стейкал
  it("checking that can't clame if you have't stake", async function () {
    await expect(staking.claim()).to.be.revertedWith(
      "you dont have stake lpTokens"
    );
  });

  // Проверка функции стейкинга
  it("checking balance after STAKE()", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken);

    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);

    // Проверяем что allowance == approveToken
    expect(
      await lpToken.connect(addr1).allowance(addr1.address, staking.address)
    ).to.be.equal(approveToken);

    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    // Проверяем количество застейканых токенов
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(
      stakeToken
    );

    // Проверяем что allowance уменьшился на stakeToken
    expect(
      await lpToken.connect(addr1).allowance(addr1.address, staking.address)
    ).to.be.equal(approveToken - stakeToken);

    // Проверяем что на балансе пользователя теперь нет токенов
    expect(await lpToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(
      0
    );

    // Проверяем что застейканые токены пула теперь на контракте стейкинга
    expect(await lpToken.connect(addr1).balanceOf(staking.address)).to.be.equal(
      stakeToken
    );

    //console.log(await lpToken.balanceOf(owner.address));
    //const tmp = 10 * 10 ** 18;
    //console.log(ethers.BigNumber.from(Number.MAX_SAFE_INTEGER));
  });

  it("checking balance after STAKE()  restaking", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);

    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);

    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    //ПОВТОРНО СТЕЙКАЕМ
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);
    // Проверяем количество застейканых токенов
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(
      stakeToken * 2
    );
    // Проверяем что allowance уменьшился на stakeToken
    expect(
      await lpToken.connect(addr1).allowance(addr1.address, staking.address)
    ).to.be.equal(approveToken - stakeToken * 2);
    // Проверяем что на балансе пользователя теперь stakeToken токенов
    expect(await lpToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(
      0
    );
    // Проверяем что застейканые токены пула теперь на контракте стейкинга
    expect(await lpToken.connect(addr1).balanceOf(staking.address)).to.be.equal(
      stakeToken * 2
    );
  });
  it("checking balance after STAKE() and restake after 10 minutes (claim => check event Transfer)", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    // Смещаем время на 10 минут
    const minutes = 10 * 60;
    await ethers.provider.send("evm_increaseTime", [minutes]);
    await ethers.provider.send("evm_mine");

    //ПОВТОРНО СТЕЙКАЕМ
    // Стейкаем токены
    const tx = await staking.connect(addr1).stake(stakeToken);

    // При повторном стейкинге после 10 минут должен вызваться claim()
    // Проверка Евента о прередаче ревардов (event Transfer)
    //console.log(tx);
    expect(tx).to.emit(myToken, "Transfer")
      .withArgs(staking.address, addr1.address, stakeToken)

    // Проверяем количество застейканых токенов
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(
      stakeToken * 2
    );

    // Проверяем что реварды были начислены
    expect(await myToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(
      (stakeToken * rewardProc * minutes) / (100 * rewardStakingTime) // ФОРМУЛА рассчета ревардов  как в контракте
    );
  });
  it("checking UNstake() immediately after STAKE()", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    //UNSTAKE()
    await expect(staking.connect(addr1).unstake()).to.be.revertedWith(
      "You should wait more time"
    );
    // Проверяем что количество застейканых токенов на месте
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(
      stakeToken
    );
  });
  it("checking UNstake() after(20m) STAKE(). and also event 2xTransfer", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    // Смещаем время на 20 минут
    const minutes = 20 * 60;
    await ethers.provider.send("evm_increaseTime", [minutes]);
    await ethers.provider.send("evm_mine");

    //UNSTAKE()
    const tx = await staking.connect(addr1).unstake();

    // При вызове unstake() должны вернутьс lptoken и должен вызваться claim() для начисления ревардов

    // Проверка Евента о прередаче lptoken (event Transfer)
    expect(tx).to.emit(lpToken, "Transfer")
      .withArgs(staking.address, addr1.address, stakeToken)

    // Проверка Евента о прередаче ревардов (event Transfer)
    expect(tx).to.emit(myToken, "Transfer")
      .withArgs(staking.address, addr1.address, stakeToken)

    // Проверяем что количество застейканых токенов = 0
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(0);

    // Проверяем что lpToken вернулись владельцу
    expect(await lpToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(stakeToken * 2);

    // Проверяем что награды myToken отправили инвестору
    expect(await myToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(
      (stakeToken * rewardProc * minutes) / (100 * rewardStakingTime) // ФОРМУЛА рассчета ревардов  как в контракте
    );

  });
  it("checking claim() immediately after STAKE()", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    //CLAIM()
    await expect(staking.connect(addr1).claim()).to.be.revertedWith(
      "You should wait more time"
    );
  });
  it("checking claim() immediately after STAKE()", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    //UNSTAKE()
    await expect(staking.connect(addr1).claim()).to.be.revertedWith(
      "You should wait more time"
    );
  });
  it("checking claim() after(1h) STAKE()", async function () {
    let approveToken = 55;
    let stakeToken = 25;

    // Переводим lpToken токены addr1 для дальнейшего стейкинга
    await lpToken.transfer(addr1.address, stakeToken * 2);
    // Разрешаем перевод "approveToken" токенов от addr1 на контракт стейкинга
    await lpToken.connect(addr1).approve(staking.address, approveToken);
    // Стейкаем токены
    await staking.connect(addr1).stake(stakeToken);

    // Смещаем время на 60 минут
    const minutes = 60 * 60;
    await ethers.provider.send("evm_increaseTime", [minutes]);
    await ethers.provider.send("evm_mine");

    //claim()
    // При вызове claim() должны начислиться реварды myToken
    const tx = await staking.connect(addr1).claim();
    // ФОРМУЛА рассчета ревардов  как в контракте
    const myReward = (stakeToken * rewardProc * minutes) / (100 * rewardStakingTime);

    // Проверка Евента о прередаче myToken (event Transfer)
    expect(tx).to.emit(myToken, "Transfer")
      .withArgs(
        staking.address, 
        addr1.address, 
        myReward)

    // Проверяем что количество застейканых ТЕПЕРЬ токенов = 0
    expect(await staking.connect(addr1).getMyStakeValue()).to.be.equal(stakeToken);

    // Проверяем что lpToken вернулись владельцу
    expect(await lpToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(stakeToken);

    // Проверяем что награды myToken отправили инвестору
    expect(await myToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(myReward);

  });
});