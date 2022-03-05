const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers } = require("hardhat");

describe.only("Staking", function () {
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

    // Проверяем что на балансе пользователя теперь stakeToken токенов
    expect(await lpToken.connect(addr1).balanceOf(addr1.address)).to.be.equal(
      stakeToken
    );

    // Проверяем что застейканые токены пула теперь на контракте стейкинга
    expect(await lpToken.connect(addr1).balanceOf(staking.address)).to.be.equal(
      stakeToken
    );

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
});
describe("Checking Token (ERC20)", function () {
  let erc20;

  const name = "MegaToken";
  const symbol = "MEGA";
  const decimals = 18;

  const mount = 55;

  // создаём экземпляры контракта
  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory("MyERC20");
    erc20 = await ERC20.deploy();
    await erc20.deployed();
  });

  // view функции
  it("Checking functions - symbol(), decimals(), name(), totalSupply()", async function () {
    //const totalSupply = 10000 * (10 ** decimals);
    const totalSupply = ethers.BigNumber.from(ethers.utils.parseEther("10000"));
    expect(await erc20.totalSupply()).to.equal(totalSupply);

    // name()
    expect(await erc20.name()).to.equal(name);
    // symbol()
    expect(await erc20.symbol()).to.equal(symbol);
    // decimals()
    expect(await erc20.decimals()).to.equal(decimals);
    // totalSupply()
    const ownerBalance = await erc20.balanceOf(owner.address);
    expect(await erc20.totalSupply()).to.equal(ownerBalance);
  });

  it("Checking function mint() event Transfer", async function () {
    // Проверяем что баланс 0
    expect(await erc20.balanceOf(addr1.address)).to.equal(0);
    // Только овнер может минтить токены
    await expect(
      erc20.connect(addr1).mint(ethers.constants.AddressZero, mount)
    ).to.be.revertedWith("Only owner can mint new tokens");

    // проверяем require(_user != address(0), "_user has the zero address");
    await expect(
      erc20.connect(owner).mint(ethers.constants.AddressZero, mount)
    ).to.be.revertedWith("_user has the zero address");

    // ПРОВЕРКА ЕВЕНТА
    // Овнер минтит адресу addr1 mount токенов
    const tx = await erc20.mint(addr1.address, mount);
    // event Transfer
    //console.log(tx);
    expect(tx)
      .to.emit(erc20, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, mount);

    expect(await erc20.balanceOf(addr1.address)).to.equal(mount);
  });
  it("Checking function balanceOf()", async function () {
    // Проверяем что баланс = 0
    expect(await erc20.balanceOf(addr1.address)).to.equal(0);
    expect(await erc20.balanceOf(addr2.address)).to.equal(0);

    const amountAddr1 = 55;
    const amountAddr2 = 65;

    // Минтим токены для addr1 и addr2
    await erc20.mint(addr1.address, amountAddr1);
    await erc20.mint(addr2.address, amountAddr2);

    // Проверяем что токены есть на балансе
    expect(await erc20.balanceOf(addr1.address)).to.equal(amountAddr1);
    expect(await erc20.balanceOf(addr2.address)).to.equal(amountAddr2);
  });
  it("Checking function transfer(), event Transfer", async function () {
    const amountAddr1 = 55;
    const amountAddr2 = 23;

    // проверяем require(_to != address(0), "transfer to the zero address");
    await expect(
      erc20.connect(addr1).transfer(ethers.constants.AddressZero, amountAddr1)
    ).to.be.revertedWith("transfer to the zero address");

    // переводим от овнера amountAddr1 токенов,
    // чтобы потом проверить что он не сможет перевести amountAddr1 + 1
    await erc20.transfer(addr1.address, amountAddr1);
    await expect(
      erc20.connect(addr1).transfer(addr2.address, amountAddr1 + 1)
    ).to.be.revertedWith("Do not enough balance");

    // переводим amountAddr2 на addr2
    await erc20.connect(addr1).transfer(addr2.address, amountAddr2);

    // проверяем балансы адресов
    expect(await erc20.balanceOf(addr1.address)).to.equal(
      amountAddr1 - amountAddr2
    );
    expect(await erc20.balanceOf(addr2.address)).to.equal(amountAddr2);

    // event Transfer
    const tx = await erc20.transfer(addr1.address, mount);
    expect(tx)
      .to.emit(erc20, "Transfer")
      .withArgs(owner.address, addr1.address, mount);
  });
  it("Checking function event Approval, aprove(), allowance(), increaseAllowance(), decreaseAllowance()", async function () {
    const amountAddr1 = 55;
    const amountIncDec = 5;
    // aprove()
    const tx = await erc20.approve(addr1.address, amountAddr1);

    // event Approval
    expect(tx)
      .to.emit(erc20, "Approval")
      .withArgs(owner.address, addr1.address, amountAddr1);

    // проверяем require(_spender != address(0), "_spender the zero address");
    await expect(
      erc20.connect(owner).approve(ethers.constants.AddressZero, mount)
    ).to.be.revertedWith("_spender the zero address");

    // allowance
    expect(await erc20.allowance(owner.address, addr1.address)).to.equal(
      amountAddr1
    );

    // increaseAllowance()
    await erc20.increaseAllowance(addr1.address, amountIncDec);
    expect(await erc20.allowance(owner.address, addr1.address)).to.equal(
      amountAddr1 + amountIncDec
    );

    // проверяем require(_allowance[msg.sender][_spender] >= _decAmount,"decreased allowance below zero");
    // вытаемся уменьшить количество approve больше чем возможно
    await expect(
      erc20
        .connect(owner)
        .decreaseAllowance(addr1.address, amountAddr1 * amountAddr1)
    ).to.be.revertedWith("decreased allowance below zero");

    // decreaseAllowance()
    await erc20.decreaseAllowance(addr1.address, amountIncDec);
    expect(await erc20.allowance(owner.address, addr1.address)).to.equal(
      amountAddr1 + amountIncDec - amountIncDec
    ); // учитываем предыдущий + amountIncDec
  });
  it("Checking function transferFrom()", async function () {
    const amount = 55;

    // Проверяем перевод если небыло апрува
    await expect(
      erc20.connect(addr1).transferFrom(owner.address, addr2.address, amount)
    ).to.be.revertedWith("Do not enough money");

    // Проверяем require(_from != address(0), "transfer from the zero address");
    // в функции _transfer
    await expect(
      erc20
        .connect(addr1)
        .transferFrom(ethers.constants.AddressZero, addr2.address, amount)
    ).to.be.revertedWith("transfer from the zero address");

    // Апрувим и проверяем балансы
    await erc20.approve(addr1.address, amount);
    expect(await erc20.balanceOf(addr1.address)).to.equal(0);
    expect(await erc20.balanceOf(addr2.address)).to.equal(0);

    // переводим проапрувенные токены и проверяем
    await erc20
      .connect(addr1)
      .transferFrom(owner.address, addr2.address, amount);
    expect(await erc20.balanceOf(addr2.address)).to.equal(amount);
  });
  it("Checking function burn()", async function () {
    const amount = 55;
    // Проверяем что сжигать нечего
    await expect(erc20.connect(addr1).burn(amount)).to.be.revertedWith(
      "burn amount exceeds balanc"
    );
    // отправляем amount токенов и проверяем баланс
    await erc20.transfer(addr1.address, amount);
    expect(await erc20.balanceOf(addr1.address)).to.equal(amount);
    // Сжигаем и проверяем что теперь баланс = 0
    await erc20.connect(addr1).burn(amount);
    expect(await erc20.balanceOf(addr1.address)).to.equal(0);
  });
  // проверка, что контракт создан овнером
  it("Checking contract creater is an owner", async function () {
    expect(await erc20.owner()).to.equal(owner.address);
  });

  // проверка, что вся эмиссия у овнера
  it("Checking Should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await erc20.balanceOf(owner.address);
    expect(await erc20.totalSupply()).to.equal(ownerBalance);
  });
});

/*
describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
*/
