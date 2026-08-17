let tousLesProduits = [];
let monPanier = JSON.parse(localStorage.getItem('devshop_panier')) || [];
let categorieActive = 'tous';
let texteRecherche = '';

const conteneur = document.getElementById('conteneurProduits');
const compteur = document.getElementById('panierCompteur');
const tiroir = document.getElementById('panierTiroir');
const listePanier = document.getElementById('listeArticlesPanier');
const totalPanierEl = document.getElementById('totalPanier');
const rechercheInput = document.getElementById('rechercheInput');
const panierIcone = document.getElementById('panierIcone');

// -------- FONCTIONS AVEC PROMISES --------

// Fonction pour charger les produits avec une Promise
function chargerProduitsAvecPromise() {
    return new Promise(function(resoudre, rejeter) {
        // Afficher le loader
        conteneur.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <p>Chargement des produits...</p>
            </div>
        `;
        
        // Faire la requête fetch
        fetch('https://fakestoreapi.com/products')
            .then(function(reponse) {
                // Vérifier si la réponse est OK
                if (!reponse.ok) {
                    rejeter(new Error('Erreur de chargement des produits'));
                }
                return reponse.json();
            })
            .then(function(donnees) {
                // Stocker les données et résoudre la Promise
                tousLesProduits = donnees;
                resoudre(donnees);
            })
            .catch(function(erreur) {
                // En cas d'erreur, rejeter la Promise
                rejeter(erreur);
            });
    });
}

// Fonction pour afficher les produits (version Promise)
function afficherProduitsAvecPromise() {
    return new Promise(function(resoudre) {
        // Filtrer par catégorie
        let produitsFiltres = [];
        
        if (categorieActive === 'tous') {
            produitsFiltres = tousLesProduits;
        } else {
            for (let i = 0; i < tousLesProduits.length; i++) {
                if (tousLesProduits[i].category === categorieActive) {
                    produitsFiltres.push(tousLesProduits[i]);
                }
            }
        }
        
        // Filtrer par recherche
        if (texteRecherche.trim() !== '') {
            const recherche = texteRecherche.toLowerCase().trim();
            const produitsRecherche = [];
            for (let i = 0; i < produitsFiltres.length; i++) {
                if (produitsFiltres[i].title.toLowerCase().includes(recherche)) {
                    produitsRecherche.push(produitsFiltres[i]);
                }
            }
            produitsFiltres = produitsRecherche;
        }
        
        if (produitsFiltres.length === 0) {
            conteneur.innerHTML = '<div class="erreur">Aucun produit ne correspond à votre recherche.</div>';
            resoudre();
            return;
        }
        
        let html = '';
        for (let i = 0; i < produitsFiltres.length; i++) {
            const produit = produitsFiltres[i];
            
            // Vérifier si le produit est dans le panier et récupérer la quantité
            let quantiteDansPanier = 0;
            for (let j = 0; j < monPanier.length; j++) {
                if (monPanier[j].id === produit.id) {
                    quantiteDansPanier = monPanier[j].quantite;
                    break;
                }
            }
            
            // Déterminer le texte du bouton
            let texteBouton = 'Ajouter au panier';
            let classeBouton = '';
            if (quantiteDansPanier > 0) {
                texteBouton = `✓ Dans le panier (${quantiteDansPanier})`;
                classeBouton = 'ajoute';
            }
            
            html += `
                <div class="carte-produit">
                    <img src="${produit.image}" alt="${produit.title}" loading="lazy">
                    <h3>${produit.title}</h3>
                    <span class="categorie-badge">${produit.category}</span>
                    <div class="prix">${produit.price.toFixed(2)} €</div>
                    <button class="ajouter-btn ${classeBouton}" onclick="ajouterAuPanier(${produit.id})">
                        ${texteBouton}
                    </button>
                </div>
            `;
        }
        
        conteneur.innerHTML = html;
        resoudre();
    });
}

// Fonction pour ajouter au panier (version Promise)
function ajouterAuPanierAvecPromise(id) {
    return new Promise(function(resoudre, rejeter) {
        // Chercher le produit dans la liste
        let produit = null;
        for (let i = 0; i < tousLesProduits.length; i++) {
            if (tousLesProduits[i].id === id) {
                produit = tousLesProduits[i];
                break;
            }
        }
        
        if (!produit) {
            rejeter(new Error('Produit non trouvé'));
            return;
        }
        
        // Vérifier si le produit est déjà dans le panier
        let existe = false;
        for (let i = 0; i < monPanier.length; i++) {
            if (monPanier[i].id === id) {
                monPanier[i].quantite = monPanier[i].quantite + 1;
                existe = true;
                break;
            }
        }
        
        // Si le produit n'est pas dans le panier, on l'ajoute
        if (!existe) {
            monPanier.push({
                id: produit.id,
                titre: produit.title,
                prix: produit.price,
                quantite: 1
            });
        }
        
        mettreAJourCompteur();
        afficherPanier();
        resoudre();
    });
}

// Fonction pour changer la quantité (version Promise)
function changerQuantiteAvecPromise(index, delta) {
    return new Promise(function(resoudre) {
        if (monPanier[index].quantite + delta <= 0) {
            monPanier.splice(index, 1);
        } else {
            monPanier[index].quantite = monPanier[index].quantite + delta;
        }
        mettreAJourCompteur();
        afficherPanier();
        resoudre();
    });
}

// Fonction pour supprimer un article (version Promise)
function supprimerArticleAvecPromise(index) {
    return new Promise(function(resoudre) {
        monPanier.splice(index, 1);
        mettreAJourCompteur();
        afficherPanier();
        resoudre();
    });
}

// -------- FONCTIONS SIMPLES (sans Promise) --------

function mettreAJourCompteur() {
    let total = 0;
    for (let i = 0; i < monPanier.length; i++) {
        total = total + monPanier[i].quantite;
    }
    compteur.textContent = total;
    localStorage.setItem('devshop_panier', JSON.stringify(monPanier));
}
console.log(monPanier);

function afficherPanier() {
    if (monPanier.length === 0) {
        listePanier.innerHTML = '<p class="panier-vide">Votre panier est vide</p>';
        totalPanierEl.innerHTML = '<span>Total</span><span>0,00 €</span>';
        return;
    }
    
    let html = '';
    let total = 0;
    
    for (let i = 0; i < monPanier.length; i++) {
        const article = monPanier[i];
        const sousTotal = article.prix * article.quantite;
        total = total + sousTotal;
        
        html += `
            <div class="article-panier">
                <div class="article-info">
                    <h4>${article.titre}</h4>
                    <small>${article.prix.toFixed(2)} € x ${article.quantite}</small>
                </div>
                <div class="article-actions">
                    <button onclick="changerQuantite(${i}, 1)" class="btn-quantite">+</button>
                    <button onclick="changerQuantite(${i}, -1)" class="btn-quantite">-</button>
                    <button onclick="supprimerArticle(${i})" class="supprimer">✕</button>
                </div>
            </div>
        `;
    }
    
    listePanier.innerHTML = html;
    totalPanierEl.innerHTML = `<span>Total</span><span>${total.toFixed(2)} €</span>`;
}

// -------- FONCTIONS GLOBALES (pour les onclick) --------

// Ces fonctions sont appelées depuis les boutons onclick dans le HTML
function ajouterAuPanier(id) {
    ajouterAuPanierAvecPromise(id)
        .then(function() {
            return afficherProduitsAvecPromise();
        })
        .catch(function(erreur) {
            console.error('Erreur:', erreur.message);
        });
}

function changerQuantite(index, delta) {
    changerQuantiteAvecPromise(index, delta)
        .then(function() {
            return afficherProduitsAvecPromise();
        })
        .catch(function(erreur) {
            console.error('Erreur:', erreur.message);
        });
}

function supprimerArticle(index) {
    supprimerArticleAvecPromise(index)
        .then(function() {
            return afficherProduitsAvecPromise();
        })
        .catch(function(erreur) {
            console.error('Erreur:', erreur.message);
        });
}

// -------- INITIALISATION AVEC PROMISES --------

// Chaîner les Promises pour l'initialisation
function initialiserApplication() {
    console.log('🚀 Démarrage de l\'application...');
    
    chargerProduitsAvecPromise()
        .then(function(donnees) {
            console.log('✅ Produits chargés avec succès :', donnees.length, 'produits');
            return afficherProduitsAvecPromise();
        })
        .then(function() {
            console.log('✅ Produits affichés avec succès');
            mettreAJourCompteur();
            console.log('✅ Panier initialisé');
        })
        .catch(function(erreur) {
            console.error('❌ Erreur lors de l\'initialisation:', erreur.message);
            conteneur.innerHTML = `
                <div class="erreur">
                    ❌ Erreur : ${erreur.message}.<br>
                    Vérifiez votre connexion internet et réessayez.
                </div>
            `;
        });
}

// -------- ÉVÉNEMENTS --------

// Filtres par catégorie
const boutonsFiltres = document.querySelectorAll('.filtre-btn');
for (let i = 0; i < boutonsFiltres.length; i++) {
    boutonsFiltres[i].addEventListener('click', function() {
        for (let j = 0; j < boutonsFiltres.length; j++) {
            boutonsFiltres[j].classList.remove('actif');
        }
        this.classList.add('actif');
        categorieActive = this.dataset.categorie;
        afficherProduitsAvecPromise();
    });
}

// Recherche en temps réel
rechercheInput.addEventListener('input', function() {
    texteRecherche = this.value;
    afficherProduitsAvecPromise();
});

// Ouvrir le tiroir panier
panierIcone.addEventListener('click', function(e) {
    e.stopPropagation();
    tiroir.classList.add('ouvert');
    afficherPanier();
});

// Fermer le tiroir panier avec le bouton fermer
document.getElementById('fermerTiroir').addEventListener('click', function(e) {
    e.stopPropagation();
    tiroir.classList.remove('ouvert');
});

// Empêcher les clics dans le panier de le fermer
tiroir.addEventListener('click', function(e) {
    e.stopPropagation();
});

// Fermer le panier quand on clique à l'extérieur
document.addEventListener('click', function(e) {
    if (tiroir.classList.contains('ouvert')) {
        const estDansTiroir = tiroir.contains(e.target);
        const estIcone = panierIcone.contains(e.target);
        
        if (!estDansTiroir && !estIcone) {
            tiroir.classList.remove('ouvert');
        }
    }
});

// Vider le panier
document.getElementById('viderPanier').addEventListener('click', function(e) {
    e.stopPropagation();
    monPanier = [];
    mettreAJourCompteur();
    afficherPanier();
    afficherProduitsAvecPromise();
});

// -------- DÉMARRAGE --------
initialiserApplication();