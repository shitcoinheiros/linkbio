type="module">
  import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js";

  // Configurações das redes blockchain - REMOVIDA BSC TESTNET
  const NETWORKS = {
    bsc: {
      chainId: "0x38",
      chainName: "Binance Smart Chain",
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      blockExplorerUrls: ["https://bscscan.com"]
    },
    ethereum: {
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      rpcUrls: ["https://mainnet.infura.io/v3/"],
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://etherscan.io"]
    },
    polygon: {
      chainId: "0x89",
      chainName: "Polygon Mainnet",
      rpcUrls: ["https://polygon-rpc.com/"],
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      blockExplorerUrls: ["https://polygonscan.com"]
    },
    base: {
      chainId: "0x2105",
      chainName: "Base Mainnet",
      rpcUrls: ["https://mainnet.base.org/"],
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://basescan.org"]
    },
    avalanche: {
      chainId: "0xA86A",
      chainName: "Avalanche Mainnet",
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
      nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
      blockExplorerUrls: ["https://snowtrace.io"]
    }
  };

  // CONTRATO
  const CONTRACT_ADDRESS = "0xe265ba69de5fbc462bdfad8186709e5d025225b0";
  
  // ABI
  const ABI = [
    "function setProfile(string calldata json) external payable",
    "function getProfile(address user) public view returns (string memory)",
    "function setProfileFree(address user, string calldata json) external",
    "function updateFeeReceiver(address newFeeReceiver) external",
    "function updateFeeAmount(uint256 newFeeAmount) external",
    "function pause() external",
    "function resume() external",
    "function emergencyWithdraw(address payable to, uint256 amount) external",
    "function transferOwnership(address newOwner) external",
    "function renounceOwnership() external",
    "function getContractBalance() external view returns (uint256)",
    "function hasProfile(address user) external view returns (bool)",
    "function getContractInfo() external view returns (address, address, uint256, bool, uint256)",
    "function calculateRefund(uint256 paidAmount) external view returns (uint256)",
    "event ProfileUpdated(address indexed user, string json)",
    "event FeeCollected(address indexed user, uint256 amount)",
    "event ExcessRefunded(address indexed user, uint256 amount)",
    "event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver)",
    "event FeeAmountUpdated(uint256 oldAmount, uint256 newAmount)"
  ];

  // Configurações da taxa
  const FEE_AMOUNT = "0.0015"; 
  const FEE_RECEIVER = "0x4A0153E289b475Fd8693f415C00813dC77b50E64";

  // Elementos do DOM
  const connectButton = document.getElementById("connectBtn");
  const walletAddressSpan = document.getElementById("walletAddr");
  const nameInput = document.getElementById("name");
  const descriptionInput = document.getElementById("description");
  const photoInput = document.getElementById("photo");
  const addLinkButton = document.getElementById("addLinkBtn");
  const linksList = document.getElementById("linksList");
  const previewName = document.getElementById("previewName");
  const previewAddr = document.getElementById("previewAddr");
  const previewDescription = document.getElementById("previewDescription");
  const avatarImg = document.getElementById("avatarImg");
  const previewLinks = document.getElementById("previewLinks");
  const saveButton = document.getElementById("saveBtn");
  const networkName = document.getElementById("networkName");
  const previewButton = document.getElementById("previewBtn");
  const avatarPlaceholder = document.getElementById("avatarPlaceholder");
  const charCount = document.getElementById("charCount");
  const walletModal = document.getElementById("walletModal");
  const closeModal = document.getElementById("closeModal");
  const networkLogo = document.getElementById("networkLogo");
  const networkDropdown = document.getElementById("networkDropdown");
  const mobileNetworkWarning = document.getElementById("mobileNetworkWarning");

  // Novos elementos para tipo de perfil
  const profileTypeSelect = document.getElementById("profileType");
  const tokenContractField = document.getElementById("tokenContractField");
  const tokenContractInput = document.getElementById("tokenContract");
  const previewType = document.getElementById("previewType");
  const rolesSection = document.getElementById("rolesSection");
  const roleCheckboxes = document.querySelectorAll('.role-checkbox input[type="checkbox"]');
  const tokenContractPreview = document.getElementById("tokenContractPreview");
  const previewTokenContract = document.getElementById("previewTokenContract");
  const badgesPreview = document.getElementById("badgesPreview");
  const tokenChartPreview = document.getElementById("tokenChartPreview");

  // Ícones disponíveis para os links
  const AVAILABLE_ICONS = [
    'bi-globe', 'bi-twitter-x', 'bi-facebook', 'bi-instagram', 'bi-linkedin', 
    'bi-github', 'bi-discord', 'bi-telegram', 'bi-youtube', 'bi-tiktok',
    'bi-reddit', 'bi-whatsapp', 'bi-envelope', 'bi-link-45deg', 'bi-share',
    'bi-heart', 'bi-star', 'bi-bookmark', 'bi-flag', 'bi-gear',
    'bi-house', 'bi-person', 'bi-people', 'bi-chat', 'bi-send',
    'bi-camera', 'bi-image', 'bi-music-note', 'bi-film', 'bi-mic'
  ];

  let signer = null;
  let userAddress = null;
  let currentNetwork = "bsc"; // BSC como rede principal

  // Detectar se é dispositivo móvel
  const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Função para verificar e mostrar aviso de rede em dispositivos móveis
  function checkMobileNetworkWarning() {
    if (isMobileDevice() && currentNetwork !== "bsc" && signer) {
      mobileNetworkWarning.classList.add('show');
    } else {
      mobileNetworkWarning.classList.remove('show');
    }
  }

  // Configuração do seletor de redes
  networkLogo.addEventListener("click", (event) => {
    event.stopPropagation();
    networkDropdown.classList.toggle("active");
  });

  // Fechar dropdown ao clicar fora
  document.addEventListener("click", (event) => {
    if (!networkLogo.contains(event.target) && !networkDropdown.contains(event.target)) {
      networkDropdown.classList.remove("active");
    }
  });

  // Selecionar rede
  document.querySelectorAll(".network-option").forEach((option) => {
    option.addEventListener("click", async () => {
      const chain = option.getAttribute("data-chain");
      
      document.querySelectorAll(".network-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      option.classList.add("active");
      
      const logoImage = option.querySelector("img").src;
      networkLogo.querySelector("img").src = logoImage;
      
      networkDropdown.classList.remove("active");
      
      if (window.ethereum && signer) {
        try {
          await switchNetwork(chain);
          currentNetwork = chain;
          updateNetworkInfo();
          checkMobileNetworkWarning(); // Verificar aviso após mudança de rede
        } catch (error) {
          console.error("Erro ao mudar de rede:", error);
          alert("Error switching to the selected network. Please check if your wallet supports this network.");
        }
      } else {
        currentNetwork = chain;
        updateNetworkInfo();
        checkMobileNetworkWarning();
      }
    });
  });

  // Função para mudar de rede na carteira
  async function switchNetwork(chain) {
    if (!window.ethereum) {
      throw new Error("Wallet not detected");
    }

    const networkConfig = NETWORKS[chain];
    if (!networkConfig) {
      throw new Error("Network not supported");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networkConfig.chainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [networkConfig]
          });
        } catch (addError) {
          throw new Error("It was not possible to add the network to the wallet");
        }
      } else {
        throw switchError;
      }
    }
  }

  // Atualizar informações da rede na interface
  function updateNetworkInfo() {
    const networkNames = {
      "bsc": "BSC",
      "ethereum": "Ethereum",
      "polygon": "Polygon",
      "base": "Base",
      "avalanche": "Avalanche"
    };
    
    networkName.textContent = networkNames[currentNetwork] || "Rede Desconhecida";
  }

  // Modal de conexão
  connectButton.onclick = () => {
    if (!signer) {
      walletModal.style.display = "flex";
      void walletModal.offsetWidth;
    } else {
      disconnectWallet();
    }
  };

  closeModal.onclick = () => {
    walletModal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === walletModal) {
      walletModal.style.display = "none";
    }
  };

  // Opções de carteira no modal - APENAS METAMASK E BINANCE
  document.getElementById("metamaskOption").onclick = connectWallet;
  document.getElementById("binanceOption").onclick = () => alert("Add chartinbio.com directly to your wallet's browser to continue.");

  // Conectar carteira
  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        walletAddressSpan.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
        previewAddr.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
        
        const network = await provider.getNetwork();
        currentNetwork = getNetworkFromChainId(network.chainId);
        updateNetworkInfo();
        
        connectButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
          </svg>
          Desconectar
        `;
        
        walletModal.style.display = "none";
        
        await loadProfileOnChain(userAddress, provider);
        
        // Verificar se deve mostrar aviso de rede móvel
        checkMobileNetworkWarning();
        
      } catch (error) {
        console.error("Erro ao conectar:", error);
        alert("Erro ao conectar carteira: " + error.message);
      }
    } else {
      if (isMobileDevice()) {
        const deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        window.location.href = deepLink;
      } else {
        alert("MetaMask not found. Please install MetaMask to continue.");
      }
    }
  }

  // Obter nome da rede a partir do chainId
  function getNetworkFromChainId(chainId) {
    const chainIdHex = "0x" + chainId.toString(16);
    
    const chainIdMap = {
      "0x1": "ethereum",
      "0x38": "bsc", 
      "0x89": "polygon",
      "0x2105": "base",
      "0xA86A": "avalanche"
    };
    
    return chainIdMap[chainIdHex] || "unknown";
  }

  // Desconectar carteira
  function disconnectWallet() {
    signer = null;
    userAddress = null;
    walletAddressSpan.textContent = "not connected";
    connectButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 9H21V11H13V9ZM13 13H21V15H13V13ZM13 17H21V19H13V17ZM4 19H10V21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H10V5H4V19ZM7 11H9V9H7V11ZM7 15H9V13H7V15ZM7 19H9V17H7V19Z" fill="currentColor"/>
      </svg>
      Connect
    `;
    mobileNetworkWarning.classList.remove('show');
  }

  // ADICIONANDO AS FUNÇÕES QUE ESTAVAM FALTANDO

  // Obter dados dos links - ATUALIZADO: removido label
  const getLinksData = () => Array.from(linksList.querySelectorAll(".link-item"))
    .map((element) => ({ 
      url: element.querySelector('.link-url-input').value,
      icon: element.querySelector('.icon-selector i').className
    }))
    .filter((link) => link.url);

  // Obter cargos selecionados
  function getSelectedRoles() {
    const selectedRoles = [];
    roleCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedRoles.push(checkbox.value);
      }
    });
    return selectedRoles;
  }

  // Renderizar preview - ATUALIZADO: ícone no centro sem nome
  function renderPreview() {
    previewName.textContent = nameInput.value || "Name";
    
    const descriptionText = descriptionInput.value || "Your description will appear here...";
    previewDescription.textContent = descriptionText;
    
    if (photoInput.value) {
      avatarImg.src = photoInput.value;
      avatarImg.style.display = "block";
      avatarPlaceholder.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarPlaceholder.style.display = "block";
    }
    
    const profileType = profileTypeSelect.value;
    if (profileType === "project") {
      previewType.textContent = "Projeto";
      previewType.style.display = "block";
      
      // Mostrar contrato do token e gráfico para projetos
      if (tokenContractInput.value) {
        tokenContractPreview.style.display = "block";
        tokenChartPreview.style.display = "block";
        previewTokenContract.textContent = tokenContractInput.value;
      } else {
        tokenContractPreview.style.display = "none";
        tokenChartPreview.style.display = "none";
      }
      
      badgesPreview.style.display = "none";
    } else {
      previewType.textContent = "Pessoal";
      previewType.style.display = "block";
      
      tokenContractPreview.style.display = "none";
      tokenChartPreview.style.display = "none";
      
      const selectedRoles = getSelectedRoles();
      if (selectedRoles.length > 0) {
        badgesPreview.style.display = "flex";
        badgesPreview.innerHTML = "";
        
        selectedRoles.forEach(role => {
          const badge = document.createElement("div");
          badge.className = `badge ${role}`;
          
          let icon = "";
          switch(role) {
            case "ceo":
              icon = "👑";
              break;
               case "hold":
              icon = "💎";
              break;
            case "coo":
              icon = "⚙️";
              break;
            case "cto":
              icon = "💻";
              break;
            case "cfo":
              icon = "💰";
              break;
            case "cmo":
              icon = "📢";
              break;
              case "kol":
              icon = "🎥";
              break;
            case "dev":
              icon = "🔧";
              break;
          }
          
          badge.innerHTML = `${icon} ${role.toUpperCase()}`;
          badgesPreview.appendChild(badge);
        });
      } else {
        badgesPreview.style.display = "none";
      }
    }
    
    previewLinks.innerHTML = "";
    for (const link of getLinksData()) {
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.className = "preview-link-item";
      
      anchor.innerHTML = `
        <div class="preview-link-icon">
          <i class="${link.icon}"></i>
        </div>
      `;
      
      previewLinks.appendChild(anchor);
    }
  }

  // Adicionar item de link - ATUALIZADO: removido campo de rótulo
  function addLinkItem(url = "", icon = "bi-link-45deg") {
    const div = document.createElement("div");
    div.className = "link-item";
    
    const iconSelectorContainer = document.createElement("div");
    iconSelectorContainer.className = "icon-selector-container";
    
    const iconSelector = document.createElement("div");
    iconSelector.className = "icon-selector";
    iconSelector.innerHTML = `<i class="${icon}"></i>`;
    
    const iconDropdown = document.createElement("div");
    iconDropdown.className = "icon-dropdown";
    
    // Popular o dropdown com ícones
    AVAILABLE_ICONS.forEach(iconClass => {
      const iconOption = document.createElement("div");
      iconOption.className = "icon-option";
      iconOption.innerHTML = `<i class="${iconClass}"></i>`;
      iconOption.addEventListener("click", () => {
        iconSelector.innerHTML = `<i class="${iconClass}"></i>`;
        iconDropdown.classList.remove("active");
        renderPreview();
      });
      iconDropdown.appendChild(iconOption);
    });
    
    iconSelector.addEventListener("click", (event) => {
      event.stopPropagation();
      // Fechar outros dropdowns abertos
      document.querySelectorAll('.icon-dropdown.active').forEach(dropdown => {
        if (dropdown !== iconDropdown) {
          dropdown.classList.remove('active');
        }
      });
      iconDropdown.classList.toggle("active");
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener("click", (event) => {
      if (!iconSelectorContainer.contains(event.target)) {
        iconDropdown.classList.remove("active");
      }
    });
    
    iconSelectorContainer.appendChild(iconSelector);
    iconSelectorContainer.appendChild(iconDropdown);
    
    const urlInput = document.createElement("input");
    urlInput.className = "link-url-input";
    urlInput.placeholder = "https://...";
    urlInput.value = url;
    
    const rowDiv = document.createElement("div");
    rowDiv.className = "link-item-row";
    rowDiv.append(iconSelectorContainer, urlInput);
    
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
      </svg>
 Remove
    `;
    deleteButton.onclick = () => { div.remove(); renderPreview(); };
    
    div.append(rowDiv, deleteButton);
    linksList.appendChild(div);
    
    urlInput.oninput = renderPreview;
    renderPreview();
  }

  // Gerenciar visibilidade dos campos condicionais
  profileTypeSelect.addEventListener("change", function() {
    if (this.value === "project") {
      tokenContractField.classList.add("visible");
      rolesSection.classList.remove("visible");
    } else {
      tokenContractField.classList.remove("visible");
      rolesSection.classList.add("visible");
    }
    renderPreview();
  });

  // Configurar checkboxes de cargos
  roleCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function() {
      const label = this.closest('.role-checkbox');
      if (this.checked) {
        label.classList.add('checked');
      } else {
        label.classList.remove('checked');
      }
      renderPreview();
    });
  });

  addLinkButton.onclick = () => addLinkItem();
  addLinkItem("https://", "bi-globe");

  [nameInput, descriptionInput, photoInput, tokenContractInput].forEach((element) => element.oninput = renderPreview);

  // Contador de caracteres para a descrição
  descriptionInput.addEventListener("input", () => {
    const count = descriptionInput.value.length;
    charCount.textContent = count;
    
    if (count > 450) {
      charCount.style.color = "var(--warning)";
    } else {
      charCount.style.color = "var(--text-muted)";
    }
    
    if (count >= 500) {
      charCount.style.color = "var(--danger)";
    }
  });

  // Função para calcular o gas price com margem de segurança
  async function getGasPriceWithMargin(provider, marginPercent = 10) {
    try {
      const feeData = await provider.getFeeData();
      const currentGasPrice = feeData.gasPrice;
      
      if (!currentGasPrice) {
        throw new Error("Não foi possível obter o gas price");
      }
      
      const margin = BigInt(marginPercent);
      const gasPriceWithMargin = currentGasPrice * (100n + margin) / 100n;
      
      return gasPriceWithMargin;
    } catch (error) {
      console.error("Erro ao obter gas price:", error);
      throw error;
    }
  }

  // Salvar perfil com transação única
  async function saveProfileWithFee() {
    if (!signer) {
      walletModal.style.display = "flex";
      void walletModal.offsetWidth;
      return;
    }
    
    if (!nameInput.value.trim()) {
      alert("Please fill in at least the profile name.");
      return;
    }

    const profile = { 
      name: nameInput.value, 
      description: descriptionInput.value,
      photo: photoInput.value, 
      links: getLinksData(),
      profileType: profileTypeSelect.value,
      tokenContract: profileTypeSelect.value === "project" ? tokenContractInput.value : "",
      roles: profileTypeSelect.value === "personal" ? getSelectedRoles() : [],
      timestamp: new Date().toISOString()
    };
    
    try {
      const userConfirmed = confirm(`🔗All your links in one place on the blockchain.✅ A single confirmation on MetaMask`);
      
      if (!userConfirmed) {
        throw new Error("Transaction canceled by the user");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      const gasPrice = await getGasPriceWithMargin(signer.provider, 15);
      
      console.log("🚀 Enviando transação única...");
      
      const tx = await contract.setProfile(JSON.stringify(profile), {
        value: ethers.parseEther(FEE_AMOUNT),
        gasPrice: gasPrice
      });
      
      alert("Confirm transaction...");
      
      const receipt = await tx.wait();
      console.log("✅ Transação confirmada:", receipt.blockNumber);
      
      alert("🎉 Perfil salvo com sucesso! Taxa processada em uma única transação.");
      
    } catch (error) { 
      console.error("Error saving profile:", error);
      
      if (error.message.includes("Insufficient balance")) {
        alert(`Erro: ${error.message}\n\nPlease add BNB to your wallet and try again.`);
      } else if (error.message.includes("user rejected")) {
        alert("Transaction canceled by the user.");
      } else if (error.message.includes("insufficient fee")) {
        alert("Por favor, use o valor exato de " + FEE_AMOUNT + " BNB.");
      } else {
        alert("Error saving profile:" + error.message);
      }
    }
  }

  // FUNÇÃO QUE ESTAVA FALTANDO - Carregar perfil da blockchain
  async function loadProfileOnChain(address, provider) {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    try {
      const jsonData = await contract.getProfile(address);
      if (jsonData) {
        const profileObject = JSON.parse(jsonData);
        nameInput.value = profileObject.name || "";
        descriptionInput.value = profileObject.description || "";
        photoInput.value = profileObject.photo || "";
        linksList.innerHTML = "";
        (profileObject.links || []).forEach((link) => addLinkItem(link.url, link.icon || "bi-link-45deg"));
        
        if (profileObject.profileType) {
          profileTypeSelect.value = profileObject.profileType;
          profileTypeSelect.dispatchEvent(new Event('change'));
          
          if (profileObject.profileType === "project" && profileObject.tokenContract) {
            tokenContractInput.value = profileObject.tokenContract;
          }
          
          if (profileObject.profileType === "personal" && profileObject.roles) {
            roleCheckboxes.forEach(checkbox => {
              checkbox.checked = profileObject.roles.includes(checkbox.value);
              const label = checkbox.closest('.role-checkbox');
              if (checkbox.checked) {
                label.classList.add('checked');
              } else {
                label.classList.remove('checked');
              }
            });
          }
        }
        
        renderPreview();
        charCount.textContent = descriptionInput.value.length;
      }
    } catch (error) { 
      console.log("Erro ao carregar perfil:", error); 
    }
  }

  // Atualizar o botão de salvar
  saveButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM15 9H5V5H15V9Z" fill="currentColor"/>
    </svg>
    Save
  `;

  // Adicionar informação sobre a taxa
  const saveButtonContainer = saveButton.parentElement;
  const feeInfo = document.createElement('div');
  feeInfo.className = 'small';
  feeInfo.style.marginTop = '8px';
  feeInfo.style.color = 'var(--text-muted)';
  feeInfo.innerHTML = `Saving your link profile on the Blockchain.`;
  if (saveButtonContainer) {
    saveButtonContainer.appendChild(feeInfo);
  }

  // Configurar o botão de salvar
  saveButton.onclick = saveProfileWithFee;

  previewButton.onclick = () => {
    if (!userAddress) {
      alert("Connect your wallet before opening the public page.");
      walletModal.style.display = "flex";
      void walletModal.offsetWidth;
      return;
    }
    const url = `profile.html?addr=${userAddress}`;
    window.open(url, "_blank");
  };

  // Inicializar preview
  renderPreview();
  updateNetworkInfo();

  // Inicializar seção de cargos como visível para perfil pessoal
  rolesSection.classList.add("visible");
