const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers } = require("hardhat");

describe("Checking myToken (ERC20)", function () {
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
      await expect(erc20.connect(addr1).burn(addr1.address, amount)).to.be.revertedWith(
        "Only owner can burn new tokens"
      );
      await expect(erc20.connect(owner).burn(addr1.address, amount)).to.be.revertedWith(
        "burn amount exceeds balanc"
      );
      
      // отправляем amount токенов и проверяем баланс
      await erc20.transfer(addr1.address, amount);
      expect(await erc20.balanceOf(addr1.address)).to.equal(amount);
      // Сжигаем и проверяем что теперь баланс = 0
      await erc20.connect(owner).burn(addr1.address, amount);
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