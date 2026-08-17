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

function chargerProduitsAvecPromise() {
    return new Promise((resoudre, rejeter) => {
        try {
            conteneur.innerHTML = `
                <div class="loader">
                    <div class="spinner"></div>
                    <p>Chargement des produits...</p>
                </div>
            `;
            
            fetch('https://fakestoreapi.com/products')
                .then((reponse) => {
                    if (!reponse.ok) {
                        throw new Error('Erreur de chargement des produits');
                    }
                    return reponse.json();
                })
                .then((donnees) => {
                    tousLesProduits = donnees;
                    resoudre(donnees);
                })
                .catch((erreur) => {
                    rejeter(erreur);
                });
        } catch (erreur) {
            rejeter(erreur);
        }
    });
}

function afficherProduitsAvecPromise() {
    return new Promise((resoudre) => {
        try {
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
                
                let quantiteDansPanier = 0;
                for (let j = 0; j < monPanier.length; j++) {
                    if (monPanier[j].id === produit.id) {
                        quantiteDansPanier = monPanier[j].quantite;
                        break;
                    }
                }
                
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
                        <div class="prix">${produit.price.toFixed(2)} FCFA</div>
                        <button class="ajouter-btn ${classeBouton}" onclick="ajouterAuPanier(${produit.id})">
                            ${texteBouton}
                        </button>
                    </div>
                `;
            }
            
            conteneur.innerHTML = html;
            resoudre();
        } catch (erreur) {
            console.error('Erreur lors de l\'affichage des produits:', erreur);
            conteneur.innerHTML = `<div class="erreur">Erreur d'affichage : ${erreur.message}</div>`;
            resoudre();
        }
    });
}

// -------- FONCTION POUR AJOUTER AU PANIER AVEC MISE À JOUR COMPLÈTE CORRIGÉE --------

function ajouterAuPanierAvecPromise(id) {
    return new Promise((resoudre, rejeter) => {
        try {
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
            
            let existe = false;
            for (let i = 0; i < monPanier.length; i++) {
                if (monPanier[i].id === id) {
                    monPanier[i].quantite = monPanier[i].quantite + 1;
                    existe = true;
                    console.log(`Produit "${produit.title}" : quantité augmentée à ${monPanier[i].quantite}`);
                    break;
                }
            }
            
            if (!existe) {
                monPanier.push({
                    id: produit.id,
                    titre: produit.title,
                    prix: produit.price,
                    quantite: 1
                });
                console.log(`Produit "${produit.title}" ajouté au panier`);
                
                // RÈGLE : N'incrémente l'indicateur barre de navigation QUE SI le produit n'existait pas
                mettreAJourCompteur(); 
            } else {
                // RÈGLE : Si le produit existe déjà, on sauvegarde quand même les nouvelles quantités dans le localStorage
                localStorage.setItem('devshop_panier', JSON.stringify(monPanier));
            }
            
            // Dans TOUS les cas, on met à jour le bouton à côté du produit et le tiroir du panier
            afficherProduitsAvecPromise(); 
            afficherPanier();           
            
            console.log('Compteur navigation actuel :', compteur.textContent);
            resoudre();
            
        } catch (erreur) {
            console.error('Erreur lors de l\'ajout au panier:', erreur);
            rejeter(erreur);
        }
    });
}

// -------- FONCTION POUR CHANGER LA QUANTITÉ --------

function changerQuantiteAvecPromise(index, delta) {
    return new Promise((resoudre, rejeter) => {
        try {
            if (monPanier[index].quantite + delta <= 0) {
                const nom = monPanier[index].titre;
                monPanier.splice(index, 1);
                console.log(`Produit "${nom}" retiré du panier`);
                // Le produit disparait complètement, on met à jour le compteur global
                mettreAJourCompteur();
            } else {
                monPanier[index].quantite = monPanier[index].quantite + delta;
                console.log(` Produit "${monPanier[index].titre}" : quantité ${monPanier[index].quantite}`);
                // Si on change juste la quantité depuis le tiroir, on applique la même logique (pas de maj du compteur global si demandé)
                localStorage.setItem('devshop_panier', JSON.stringify(monPanier));
            }
            
            afficherProduitsAvecPromise();
            afficherPanier();           
            resoudre();
        } catch (erreur) {
            rejeter(erreur);
        }
    });
}

// -------- FONCTION POUR SUPPRIMER UN ARTICLE --------

function supprimerArticleAvecPromise(index) {
    return new Promise((resoudre, rejeter) => {
        try {
            const nom = monPanier[index].titre;
            monPanier.splice(index, 1);
            console.log(`Produit "${nom}" supprimé du panier`);
            // MISE À JOUR COMPLÈTE
            mettreAJourCompteur();      // je mets à jour l'icône
            afficherPanier();           // je mets à jour le contenu du panier
            resoudre();
        } catch (erreur) {
            rejeter(erreur);
        }
    });
}

// -------- FONCTIONS SIMPLES CORRIGÉES --------

function mettreAJourCompteur() {
    try {
        // Le compteur de la barre de navigation affiche le nombre d'articles UNIQUES (la longueur du tableau)
        let totalArticlesUniques = monPanier.length;
        
        // Mettre à jour l'affichage du compteur de la barre de navigation
        compteur.textContent = totalArticlesUniques;
        
        // Sauvegarder dans localStorage
        localStorage.setItem('devshop_panier', JSON.stringify(monPanier));
        
        console.log(` Compteur navigation mis à jour : ${totalArticlesUniques} types d'articles uniques`);
        
        // Vérifier si la mise à jour a fonctionné
        if (compteur.textContent != totalArticlesUniques) {
            console.warn('Le compteur n\'a pas été mis à jour correctement !');
            compteur.textContent = totalArticlesUniques;
        }
        
    } catch (erreur) {
        console.error('Erreur lors de la mise à jour du compteur:', erreur);
    }
}

function afficherPanier() {
    try {
        if (monPanier.length === 0) {
            listePanier.innerHTML = '<p class="panier-vide">Votre panier est vide</p>';
            totalPanierEl.innerHTML = '<span>Total</span><span>0,00 FCFA</span>';
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
                        <small>${article.prix.toFixed(2)} FCFA x ${article.quantite}</small>
                    </div>
                    <div class="article-actions">
                        <button class="btn-quantite" data-index="${i}" data-delta="1">+</button>
                        <button class="btn-quantite" data-index="${i}" data-delta="-1">-</button>
                        <button class="supprimer" data-index="${i}">✕</button>
                    </div>
                </div>
            `;
        }
        
        listePanier.innerHTML = html;
        totalPanierEl.innerHTML = `<span>Total</span><span>${total.toFixed(2)} FCFA</span>`;
        
        // Ajouter les événements sur les boutons du panier
        const boutonsQuantite = document.querySelectorAll('.btn-quantite');
        for (let i = 0; i < boutonsQuantite.length; i++) {
            boutonsQuantite[i].addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                const delta = parseInt(this.dataset.delta);
                changerQuantite(index, delta);
            });
        }
        
        const boutonsSupprimer = document.querySelectorAll('.supprimer');
        for (let i = 0; i < boutonsSupprimer.length; i++) {
            boutonsSupprimer[i].addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                supprimerArticle(index);
            });
        }
        
    } catch (erreur) {
        console.error('Erreur lors de l\'affichage du panier:', erreur);
    }
}

// -------- FONCTIONS GLOBALES (pour les onclick) --------

function ajouterAuPanier(id) {
    console.log('Clic sur "Ajouter au panier" pour le produit ID:', id);
    
    ajouterAuPanierAvecPromise(id)
        .then(() => {
            console.log('Produit traité, rafraîchissement visuel terminé.');
        })
        .catch((erreur) => {
            console.error(' Erreur lors de l\'ajout au panier:', erreur.message);
        });
}

function changerQuantite(index, delta) {
    console.log('Changement de quantité pour l\'article', index, 'delta:', delta);
    
    changerQuantiteAvecPromise(index, delta)
        .then(() => {
            return afficherProduitsAvecPromise();
        })
        .then(() => {
            console.log('Compteur actuel :', compteur.textContent);
        })
        .catch((erreur) => {
            console.error('Erreur lors du changement de quantité:', erreur.message);
        });
}

function supprimerArticle(index) {
    console.log('Suppression de l\'article', index);
    
    supprimerArticleAvecPromise(index)
        .then(() => {
            return afficherProduitsAvecPromise();
        })
        .then(() => {
            console.log('Compteur actuel :', compteur.textContent);
        })
        .catch((erreur) => {
            console.error('Erreur lors de la suppression:', erreur.message);
        });
}

// -------- FONCTIONS ASYNCHRONES --------

async function chargerProduitsAsync() {
    try {
        conteneur.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <p>Chargement des produits...</p>
            </div>
        `;
        
        const reponse = await fetch('https://fakestoreapi.com/products');
        
        if (!reponse.ok) {
            throw new Error('Erreur de chargement des produits');
        }
        
        const donnees = await reponse.json();
        tousLesProduits = donnees;
        await afficherProduitsAvecPromise();
        
        console.log('Produits chargés avec succès :', tousLesProduits.length, 'produits');
    } catch (erreur) {
        console.error(' Erreur lors du chargement des produits:', erreur);
        conteneur.innerHTML = `
            <div class="erreur">
                Erreur : ${erreur.message}.<br>
                Vérifiez votre connexion internet et réessayez.
            </div>
        `;
    }
}

async function initialiserApplication() {
    try {
        console.log('Démarrage de l\'application...');
        mettreAJourCompteur();
        await chargerProduitsAsync();
        console.log('Application initialisée avec succès');
        console.log('Compteur initial :', compteur.textContent);
    } catch (erreur) {
        console.error('Erreur lors de l\'initialisation:', erreur);
        conteneur.innerHTML = `
            <div class="erreur">
                Erreur d'initialisation : ${erreur.message}
            </div>
        `;
    }
}

// -------- ÉVÉNEMENTS --------

// Filtres par catégorie
const boutonsFiltres = document.querySelectorAll('.filtre-btn');
for (let i = 0; i < boutonsFiltres.length; i++) {
    boutonsFiltres[i].addEventListener('click', async function() {
        try {
            for (let j = 0; j < boutonsFiltres.length; j++) {
                boutonsFiltres[j].classList.remove('actif');
            }
            this.classList.add('actif');
            categorieActive = this.dataset.categorie;
            await afficherProduitsAvecPromise();
        } catch (erreur) {
            console.error('Erreur lors du filtrage:', erreur);
        }
    });
}

// Recherche en temps réel
rechercheInput.addEventListener('input', async function() {
    try {
        texteRecherche = this.value;
        await afficherProduitsAvecPromise();
    } catch (erreur) {
        console.error('Erreur lors de la recherche:', erreur);
    }
});


// Ouvrir le tiroir panier
if (panierIcone) {
    panierIcone.addEventListener('click', function(e) {
        try {
            e.stopPropagation();
            tiroir.classList.add('ouvert');
            afficherPanier();
        } catch (erreur) {
            console.error('Erreur lors de l\'ouverture du panier:', erreur);
        }
    });
}

// Fermer le tiroir panier avec le bouton fermer
const boutonFermer = document.getElementById('fermerTiroir');
if (boutonFermer) {
    boutonFermer.addEventListener('click', function(e) {
        try {
            e.stopPropagation();
            tiroir.classList.remove('ouvert');
        } catch (erreur) {
            console.error('Erreur lors de la fermeture du panier:', erreur);
        }
    });
}

// Empêcher les clics dans le panier de le fermer
if (tiroir) {
    tiroir.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Fermer le panier quand on clique à l'extérieur
document.addEventListener('click', function(e) {
    try {
        if (tiroir && tiroir.classList.contains('ouvert')) {
            const estDansTiroir = tiroir.contains(e.target);
            const estIcone = panierIcone ? panierIcone.contains(e.target) : false;
            
            if (!estDansTiroir && !estIcone) {
                tiroir.classList.remove('ouvert');
            }
        }
    } catch (erreur) {
        console.error('Erreur lors de l\'fermeture globale du panier:', erreur);
    }
});

// Vider le panier
const boutonVider = document.getElementById('viderPanier');
if (boutonVider) {
    boutonVider.addEventListener('click', async function(e) {
        try {
            e.stopPropagation();
            monPanier = [];
            mettreAJourCompteur(); // je réinitialise le compteur de la navbar à 0
            afficherPanier();      // j'affiche le message "Votre panier est vide"
            await afficherProduitsAvecPromise(); // je remets tous les boutons des cartes à "Ajouter au panier"
            console.log('🗑️ Panier vidé');
        } catch (erreur) {
            console.error('Erreur lors du vidage du panier:', erreur);
        }
    });
}

// -------- DÉMARRAGE --------
initialiserApplication();
