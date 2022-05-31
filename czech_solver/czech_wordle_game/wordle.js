var word = '';
var no = 0;
var board = [];
var wordLetters = {};
var cRow = 0;
var cCol = 0;
var animation = false;
var solved = '';
var nextWordDT = null;
var logIt = true;
var wordPattern = "";
var animationDelay = 0;

var waitForAnswer = false;
var waitForAnswerPeriodicTime = 30; //ms

// var socket;

const INIT_STATE = "init";
const PATTERN_STATE = "pattern";
const LOSS_STATE = "loss";
const VICTORY_STATE = "victory";

const equivLetters = {
'a': ['a', 'Ăˇ'],
'b': ['b'],
'c': ['c', 'ÄŤ'],
'd': ['d', 'ÄŹ'],
'e': ['e', 'Ä›', 'Ă©'],
'f': ['f'],
'g': ['g'],
'h': ['h'],
'i': ['i', 'Ă­'],
'j': ['j'],
'k': ['k'],
'l': ['l'],
'm': ['m'],
'n': ['n', 'Ĺ'],
'o': ['o', 'Ăł'],
'p': ['p'],
'q': ['q'],
'r': ['r', 'Ĺ™'],
's': ['s', 'Ĺˇ'],
't': ['t', 'ĹĄ'],
'u': ['u', 'Ăş', 'ĹŻ'],
'v': ['v'],
'w': ['w'],
'x': ['x'],
'y': ['y', 'Ă˝'],
'z': ['z', 'Ĺľ'],
};

var key2letter = {};

Object.entries(equivLetters).forEach(([l, ks]) => {
    ks.forEach(k => {
        key2letter[k] = l;
    })
});

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function initModified(tn) {
    console.log('Game Init');
    word = pickupRandomWord();
    // word = "horka";
    sendViaWebsocket(INIT_STATE, word);
    console.log(word);
    no = parseInt(localStorage.getItem('wordle.no')) + 1;
    // process word
    for (var i = 0; i < word.length; ++i) {
        const k = key2letter[word[i]];
        if (k in wordLetters)
            wordLetters[k] += 1;
        else
            wordLetters[k] = 1;
    }
    makeKbd();
    // restore?
    const sno = localStorage.getItem('wordle.no');
    if (sno && no == parseInt(sno)) {
        board = JSON.parse(localStorage.getItem("wordle.board"));
        for (var r = 0; r < board.length; ++r) {
            cRow = r;
            for (var c = 0; c < board[r].length; ++c) {
                cCol = c;
                showLetter(c);
            }
            if (board[r].length == 5) {
                if (wordFound() || cRow > 4) {
                    cRow += 1;
                    solved = 'already';
                    victory();
                    break;
                }
            }
            cCol = 0;
        }
    } else {
        board[0] = [];
        localStorage.setItem('wordle.no', no);
        localStorage.setItem('wordle.board', JSON.stringify(board));
    }
    if (!solved && cRow < 6 && cCol < 5)
        gEl('c' + cRow + cCol).classList.add('cursor');
    window.addEventListener('keydown', keyPress);
    // next word timer
    nextWordDT = new Date();
    nextWordDT.setSeconds(nextWordDT.getSeconds() + tn);
    console.log('next in', tn, 'secs -', nextWordDT);
    setTimeout(checkNewWord, 5 * 60 * 1000);
    let counter = 0;
    while (true) {
        if (counter < 10) {
            if (wordPattern === "" || waitForAnswer) {
                await sleep(waitForAnswerPeriodicTime);
                console.log("waitForAnswer: " + waitForAnswer);
            } else {
                await sendViaWebsocket(PATTERN_STATE, wordPattern).then((message) => {
                    console.log("Code here: " + message);
                }).catch((error) => {
                    console.log("Code here: " + error);
                });
                wordPattern = "";
            }
            // counter++;
        } else {
            break;
        }
    }
    console.log("posledni radek z initu");
}

function checkNewWord() {
    const d = new Date();
    if (d > nextWordDT) {
        console.log(d, nextWordDT, d > nextWordDT, solved);
        if (solved && confirm('HrĂˇt novĂ© slovo?')) {
            location.reload();
            return;
        }
        // postpone
        nextWordDT = new Date();
        nextWordDT.setSeconds(nextWordDT.getSeconds() + 5*60);
    }
    setTimeout(checkNewWord, 5*1000);
}

function gEl(id) {
    return document.getElementById(id);
}

function cEl(t) {
    return document.createElement(t);
}

function makeKbd() {
    var kbdEl = gEl('klavesnice');
    const keys = Object.keys(equivLetters);
    for (var i=0; i<keys.length; ++i) {
        var el = cEl('button');
        // el.classList.add('key');
        el.innerHTML = keys[i];
        el.id = 'key_' + keys[i];
        el.addEventListener('click', keyClick);
        kbdEl.appendChild(el);
    }
    const spec = [['âŚ«', 'backspace'], ['âŹŽ', 'enter']];
    for (var i=0; i< spec.length; ++i) {
        var el = cEl('button');
        if (spec[i].length) {
            el.classList.add('spec_key');
            el.innerHTML = spec[i][0];
            el.id = 'key_' + spec[i][1];
        }
        el.addEventListener('click', keyClick);
        kbdEl.appendChild(el);
    }
}

function toggleHelp() {
    var hEl = gEl('jak-hrat');
    if (hEl.style.display == 'none') {
        hEl.style.display = 'block';
        gEl('hra').style.display = 'none';
    } else {
        hEl.style.display = 'none';
        gEl('hra').style.display = 'block';
    }
}

function keyPress(e) {
    const key = e.key.toLowerCase();
    readKey(key);
}

function keyClick(e) {
    const key = e.target.id.substring(4);
    readKey(key);
}

function readKey(key) {
    if (solved) {
        if (key == 'enter' && gEl('vitezstvi').style.display != 'block')
            victory();
        return;
    }
    if (animation)
        return;
    if (cRow > 5)
        return;
    if (key in key2letter) {
        addLetter(key2letter[key]);
    } else
    if (key == 'backspace') {
        delLetter();
    } else
    if (key == 'enter') {
        validateRow();
    }
}

function addLetter(k) {
    if (cCol > 4)
        return;
    board[cRow][cCol] = k;
    var el = gEl('c'+cRow+cCol);
    el.innerHTML = k;
    el.classList.remove('cursor');
    cCol += 1;
    if (cCol < 5)
        gEl('c'+cRow+cCol).classList.add('cursor');
}

function delLetter() {
    if (cCol < 1)
        return;
    if (cCol < 5)
        gEl('c'+cRow+cCol).classList.remove('cursor');
    cCol -= 1;
    el = gEl('c'+cRow+cCol);
    el.innerHTML = '';
    el.classList.add('cursor');
    board[cRow][cCol] = '';
}

function validateRow() {
    const delay = animationDelay;
    animation = true;
    if (!wordOK()) {
        gEl('r'+cRow).classList.toggle('row-warn');
        document.body.classList.toggle('bg-warn');
        setTimeout(endWarn, 500);
        return;
    }
    for (var i = 0; i < 5; ++i) {
        if (i) {
            showLetter(i);
            // setTimeout(showLetter, i*delay, i);
        } else {
            showLetter(i);
        }
    }
    setTimeout(validateVictory, 5*delay);
}

function endWarn() {
    gEl('r'+cRow).classList.toggle('row-warn');
    document.body.classList.toggle('bg-warn');
    animation = false;
}

function wordOK() {
    var w = '';
    for (var i = 0; i<cCol; ++i) {
        w += gEl('c'+cRow+i).innerText;
        w = w.toLowerCase();
    }

    if (w.length < 5)
        return false;
    var pos = 0;
    while (1) {
        pos = allWords.indexOf(w, pos);
        if (pos < 0) {
            break;
        }
        if (pos % 5 == 0) {
            return true;
        }
        pos += 1;
    }
    srvLog('w', w);
    return false;
}

function getLetterState(x) {
    const pl = board[cRow][x];
    // not present
    if (!(pl in wordLetters))
        return 0;
    // placed
    if (pl == key2letter[word[x]])
        return 2;
    // check placed
    var placed = 0;
    for (var i=0; i<board[cRow].length; ++i)
        if (pl == board[cRow][i] && pl == key2letter[word[i]])
            placed += 1;
    if (placed >= wordLetters[pl])
        return 0;
    // check already present
    placed = 0;
    for (var i=0; i<x; ++i)
        if (pl == board[cRow][i])
            placed += 1;
    if (placed >= wordLetters[pl])
        return 0;
    // present
    return 1;
}

function getKeyState(x) {
    const pl = board[cRow][x];
    if (!wordLetters[pl])
        return 0;
    var placed = 0;
    for (var i=0; i<=board[cRow].length; ++i)
        if (pl == board[cRow][i] && pl == key2letter[word[i]])
            placed += 1;
    if (placed == wordLetters[pl])
        return 2;
    return 1;
}

function showLetter(i) {
    var el = gEl('c'+cRow+i);
    const ls = getLetterState(i);
    if (ls == 2) {
        el.classList.add('p-placed');
        el.innerHTML = word[i];
        el.classList.remove('p-present');
        console.log("pattern 2");
        wordPattern += "2";
    } else
    if (ls == 1) {
        el.classList.add('p-present');
        el.innerHTML = board[cRow][i];
        console.log("pattern 1");
        wordPattern += "1";
    } else {
        el.classList.add('p-absent');
        el.innerHTML = board[cRow][i];
        console.log("pattern 0");
        wordPattern += "0";
    }
    var kel = gEl('key_' + board[cRow][i]);
    const ks = getKeyState(i);
    if (ks == 2) {
        kel.classList.add('p-placed');
        kel.classList.remove('p-present');
    } else
    if (ks == 1) {
        if (!kel.classList.contains('p-placed'))
            kel.classList.add('p-present');
    } else {
        kel.classList.add('p-absent');
    }
}

function wordFound() {
    var done = true;
    for (var i = 0; i<cCol; ++i) {
        var pl = gEl('c'+cRow+i).innerHTML;
        var wl = word[i];
        if (pl != wl) {
            done = false;
            break;
        }
    }
    return done;
}

function srvLog(m, s) {
    if (!logIt)
        return;
    const rq = new XMLHttpRequest();
    rq.open('GET', './'+m+'/?'+s);
    rq.send();
}

function validateVictory() {
    var done = wordFound();
    cCol = 0;
    cRow += 1;
    if (cRow < 6)
        gEl('c'+cRow+cCol).classList.add('cursor');
    animation = false;
    if (done) {
        if (!localStorage.getItem('wordle.score' + no)) {
            srvLog('r', no+'_'+cRow);
            localStorage.setItem('wordle.score' + no, cRow);
        }
        solved = 'won';
        console.log(wordPattern);
        sendViaWebsocket(VICTORY_STATE, wordPattern);
        victory();
    } else
    if (cRow == 6) {
        srvLog('r', no+'_7');
        localStorage.setItem('wordle.score' + no, 7);
        solved = 'lost';
        console.log(wordPattern);
        sendViaWebsocket(LOSS_STATE, wordPattern);
        victory();
    } else {
        board[cRow] = [];
    }
    localStorage.setItem('wordle.board', JSON.stringify(board));
}

function victory() {
    var grats = 'Dnes jiĹľ mĂˇte odehrĂˇno';
    if (solved == 'won')
        grats = 'Gratuluji!';
    else
    if (solved == 'lost')
         grats =  'Bylo to slovo â€ž'+word+'â€ś';
    gEl('grats').innerHTML = grats;
    gEl('hra').style.display = 'none';
    gEl('vitezstvi').style.display = 'block';
    var txt = 'Wordle.cz â„– '+(no+1)+'\n\n';
    for (var r=0; r<cRow; ++r) {
        for (var c=0; c<5; ++c) {
            const cl = gEl('c'+r+c).classList;
            if (cl.contains('p-placed'))
                txt += '&#x1F7E9;';
            else
            if (cl.contains('p-present'))
                txt += '&#x1F7E8;';
            else
                txt += '&#x2B1C;';
        }
        txt += '\n';

    }
    gEl('sdilet').innerHTML = txt;
    // graf
    gEl('graf').innerHTML = makeGraph(7);
    // sleep(1000);
    while(waitForAnswer) {
        sleep(waitForAnswerPeriodicTime);
    }
    location.reload();
}

function copyTA(butt, elmId) {
    butt.innerHTML += ' âś…';
    var el = gEl(elmId);
    el.focus();
    el.select();
    document.execCommand('copy');
    el.blur();
    //el.selectionStart = el.selectionEnd;
}

function closeVictory() {
    gEl('hra').style.display = 'block';
    gEl('vitezstvi').style.display = 'none';
}

function makeGraph(len) {
    var out = '';
    for (var y = 0; y < 7; ++y) {
        for (var i = no - len + 1; i<=no; ++i) {
            var v = localStorage.getItem('wordle.score' + i);
            v = v ? parseInt(v) : 0;
            if (y < v) {
                if (y < 6)
                    out += y < 3 ? '&#x1F7E9;' : '&#x1F7E8;';
                else
                    out += '&#x1F7E5;'
            } else
                out += '&#x2B1C;'
        }
        out += '\n';
    }
    return out;
}

function displayHistory(hist) {
    let total = 0, count = 0;
    let myTotal = 0, myCount = 0;
    for (var i in hist) {
        const n = hist[i][0];
        const avg = hist[i][1];
        const cnt = hist[i][2];
        let v = localStorage.getItem('wordle.score' + n);
        var elm = gEl('st'+n);
        var txt = '';
        if (v) {
            v = parseInt(v);
            elm.style.textAlign = 'center';
            if (v > avg) elm.style.color = 'red';
            else
            if (v < avg) elm.style.color = 'green';
            txt = v;
            total += avg * cnt;
            count += cnt;
            myTotal += v;
            myCount += 1;
        }
        elm.innerHTML = txt;
    }
    gEl('st_avg1').innerHTML = (total/count).toFixed(2).replace('.', ',');
    gEl('st_avg2').innerHTML = (myTotal/myCount).toFixed(1).replace('.', ',');
    gEl('st_avg2').style.color = total/count < myTotal/myCount ? 'red' : 'green';
}

const allWords = 'sferaasiatceckosvetrdrnaksaveclesakpornonadrzzaveszaverselenzavetnadralehkotloukregalparianadromydlozamisbazendelkalumikmaniksmrstmatkauzitiracnaprizezamerlvountrzbavezenzluvapletigotikvypekvznikxindlspechcesacuhrabpulkarimsapuvabhurkakytkapandabinecsondajidisvarkavitezbezkafjordcecekremenslehasklebzkrutsezambubenkujondikcearzensklephovorsinkabodlolebkasmradhokejforumdzbanberkasvitazlutokuryrguidedelbasyrarsvrabgalonvinylbehnastrazkanecjikratatkatatiktendrstransterkkyrystepnapajzlpulecidylaemocebrizasimkazavejburzadovozstazeglosadavnobarkahorkodemprrelaxpecarsiruptesilhorkadogmarecesujezduvrathobojfloraodvarstadofakirsponavazkanorekodvalsmyslkraulnovicvodkatelkahonecpracevecnolodkamickapintahlinavackastvolmladistropkankamladepadlorusinjitrostrompolirpizzabaretdilecsuknolisejrehotrukavkovarsuknedilekswingsifonsyselpokecbeckosankybarelbeckavudceokrinhoreckukantydenmackazvestaliasrefyzmicekzimaknasypkulkaoraniternochrupjarmomaniemalbagaucodrozdcizekoranzvyvodvideosenikpohanhrdlojelentrampdurumpsounscenanugathuliczadaktremaviolabidlotrempnapisrosolfelakbukvapotizdebutlazardoletoblakzranikerikaromamotylpatroketasmilarhovnoodvrhvozikzatkafenkahrivagolempalascinelmotellemradebilpalactlamamazutmasoxopratnouzecivkafenylvykyvzabakoblatslohaverzekojnanavinlesbazdivooptikozubirolkazilkachladbavicpasakdrzakpencechlapporizotvortokensobeckliseksefttorzeubrustorzovpustpekansmenapisentangoodporlumeksidlokravasumakzaludsogunnuzkycinkadopallipkazenacpaketzetonstoikotcimlihyrkosaksonetaluzepodeskomikbydlominuskominlilektyckavizkadildoobrokvlcekpylonlepickobkabednaumrtivapnoalibihordabuvoldivakdivanskobabrouksteskodvodhajnyzezloodesametacbajkaalarmmetalrabatmetancuriemetaruhonacislostryclomozmlekoarkusmytuszapisradioloubiradilradicambrakavkatoastvrzotvyrezkutnaledarbarvaburaksefkaobtizaxiomvetryustrkplatoedicevenekbotkakubikvenecdorazmulatslagrsadravyterkazenvztahruinakopracolekjilekrivalkokonjatkajilecsetupoferadozoruhlakhabitparohslechokounlhutalekarverejdrzbaheversortaskluzdlatoetujebyceknerezjedlepampaferblcizbavyzvaodreztkanifabornosickulmamankonosikmottotisichasicumyslgekonhasishumnogenuszroutlogikvikyrbutikjinanbutenskalpstupakyvaltrustetherbingorampaobcanzatezlatrorezbaopichkamoshosiksalonruliknopalblumamasnastenamanezprasecinzetipartunakgeoidorkanvybercetarbrckotrestzakopkrcekpokustreskmlatovybehpopelgarazmyrtavetevvetescidlopasirpoharsplinpazdikotelpasikzemlefotonkotecpekarpychajahenvejirlustrsibalkomzealkenpekacvozkakliprbilekneterhobitautakodtokkapieorechfankaoceanzlotyhrtanhacekborschrichgildavyhentulenjatkyroupyradzabuznatildamufleplastmetylnasupdyadapohonsochavyluhaktinnazornehetaktivponorcejchstenepolomskautosmakpohovposelskaravykopposednacrtznamaboxerznamybandazakonteploustavodpadodpaljasanmlicivrataadrieskicaimiseodparvrhacplicespinamazecrevenlejzrbluzanahonzadrzmazelkasnahumortupechlizazkratobutinavykvikarnarodkabatlampakopacnarokporyvpokrmloknakozkapozoragamanapojviniknekovsecnafesakzbrojvojakzahulsatnaknihapotoktrpytanimevymolrebuszamekatletuchopcivilobilirezeksofersametprcekbodikdubkauvahasamecsekceslukalemplpopissoskaberlatajgaberlesmolapakunpirohcumeldriviparnozatvabudarosvitokresramarmesictovarsprotturindubenjekotulohajavorjeslepenalproudnajempadliaortanaukaperejseslezalivbohaclihennakupstaraskvorbuceksiskasypacodbytnemecsabespanakskrobjuntapomerlucbaexceshribeuchytdizkadepotslinajurtabienaterenrodakhuckadevonpalmauklonfrezaomegastokaobratsigmaobrazvervapoctadirkaobavasackoobradnavesvarlejostarozumosadasirkajmelipazitdatumjogindotekjezidkrizemarkamachrtornamrhacdmutisitkaskvarmachahrbolpeklositkokloubodbojsadbafandaamebavyvarodbodveganksaftcetbashodaodlomfrapeodborhulkarusakkycelcykastikotskorelzicepicusukladrounolimecperutotreskuponpostaotrepbidaktrenitrendnaporradarrentaspuntbaletsipekobtokfikusobzortaborhereckuzleridicpupenpupektykevdendybotelzivotmichazrakytrhakbedlamyvalbehakrajonurodakolielokajprudalokallvicenylonupatilovcikolikzavinbitkakebabosivotisenmodulspalaparmazobanlekcemodusdrdolsyticmobilkonikarkyrdopisbazarbabcakriplsatanetudasluchodmerfikcevidlefinisvecerfutongejsaaltanobnosolivapobytuzinavypisodsunradonreprotranzfaunatranskasararealagensnymfatirazagenttopictrumfcepinorgiehadkastolaberantirakemisesalatvzletjidloosobatrotlsilonvitacopiatsjezdsrdcedlahamockaskladselkaclonamnichsejkrsklarkatarautorbetonpepkauterymaslomuziktapasmaslemangodzberpalbakatankulakkupecmagorvylezjunakmajkakanyrkvadrorteltaviclyrikcisarformakrestvylevpytelmetlarondoposuvsatyrkacerfotaktiaratoxinobdivpojemtonikflinksabatmarzefenolkibucprejtprimazmenavarankvititropyknizemletioperakupkaflexazajicflexekapkajizbastrojmamontichocitathymnakalonpokercitacvytahbitvapivarluzkocumilhonicmoulaalbumkanontypekzaborzinkakanoekolnarahnosopkadredyvztekstelatitullisarefektbarazpoemavydutvyjevspletbarakrebelvarnalisaksanonprvakalkydhorakzahathoralnasepgustocovidplanedomeknaseknosalcizaktenissalsaviskavalkaradnistvacokruhdraftdytikmosazvilkavdechpelesherdalapkapizdarevuesadkadrevozidkaakteruzliknarazgruntdolarzavanvolacfekalborecvolandilkopegasbozecvinkodelicprastuskoksrpensrpekchlorboulematesreteztalirmotaksportrozenrypalrypakmaltalhanibrlohidealsrafapadrtbernezackavstuppaseksketasotekpagerlososlatexseriehmotakauzaarchadusikbradakorankoralporekrundakorabcakannabehzahonmincefemurmerikzaspihruzamericpetkarezielahevskrinrupierezimhyrilbrigaholbaveslokaplealelapanossavlemozekmasakodlivsvicesurikcesloblbecfusakmasazkosermilecbombaparbabujonborbaramusrolakbisonsonarkocarudobivojnapauzabubakzaparjmenijmenozabkaanalyvolnobuketsporarybizmenaztezbachuvapozerrouradeckodiodadeckalabelotlakvousymekacjetelachatgardeladickuklacelbagardasparaadeptmagnamylkalipanovcakbunkazrudanuzakbelicducejsarzedatelrumundrogadamanbratrskutrbolakdivkavenikburenvelurchudyvizazpetitvydajsazectenzeputkaklikamosnatorbaucastkavylamantgestopilotceltakolosofinazacpatrokymysokpatosruzekobsahklaunjiskaradcevlastpinkapocetbrejkodsypcihlamluvariksabalicmedikaprilbalikmrskatafkabijaktaterzkazaneraddalkasektaodhozhvozdcetkapifkavedeczbytifiakrdabertolarodnozsaldodabelromkacapkatrkacostriuradahuhlaakcievkladvytokbunkrzvireakcizdverefoyermodemtilkohlavapijaktanectoporpijansypektopolhadektunkapachtrydlohadecethylroversambaparakboraxparatrovenlarvamodlamestohopiklouzerastrtyfusglumahalirhalitvyzleharasvelindlenidosypedikttablovtiskmalusvydejnaplntitanpasmotarotmagmahackopokynpenisujetisvinekamejlunakkamenmrchamyrhalegatstopasuchohaluzvazalzitnasesitvazaksycaknotorvazacdruidvulvaopiumvokalnaftamixerkurakkuratcevkakaratnecasstanivozbatarasteckakurazkalictulakfousykalifrolbaimageucaristrikdenarstrihmakaksesuvmopedzelvapivotsloupessejkoktafrckadetoxponcoleckapokojzaporstarilianapokosoktansovetstaryikonaremizbundaposypremixnitkabefelchataspiclkacirliscesarinpovelorlikobocicakrakladanotarsekacfakanflirttonervymetvymerumenijazykfialatahacciratpsinahounebluesfazorpiklekrekrcichaidiotduvoddupotdrahaidiomtrasavyhozutvarhlivapustapoctyokapityranzloundriftnazevkolbasafarbalzafetisvlcakslanglaznerutinzakalsickasancepohybvinekmisalmimikcunikvacekorsejsennapesecurbardyskoskryspesekafektgeodasluneprincakordpitkaplesohulansvistpitkofintadrazechtickastananukbatohprachjelecramecosikakmentmandlpsoukcedicdupaksmaltnaruccmyrakvaltmesecptacezupanolovoslavadojaknapadodkupkozakzradalavkalabutkomarsamotnalevnaletoboranalezbohemdevkasmulaokenamustrcesnorcenihurdazivakvlahastretspionsmrnczabalrazbapalichanzarakevarenasamanbiblenavalbekotvladadoupebodecmilkapriorzabarsokoltoustskvalsuflemakrootrokdativbobekruskotetkaskodaruskarohozobvazrejdaskyvarybkacurakvykalemojivyletmekotvartamarodpizmobolenpedeltackyobrystristturbopismoturbanomadohledmerkasudbakosikcidicvykazkosirveksltrhaclevakvrtacobvodtrhansaltopsotalackabidetsocanubociduetokefirvyskaanexelodarpemzarevirpompaohrevbuzekvolbauzenecouraplenavolbyhrachuzenihrbetpilirmlakakusnaklestodlovodletlankoodhodoponarostisusakvydrazrnkoryzecvysekbankavysecmumiepajanrajkavydrzvysevdotazzapadleteckoupezapalpecenpiniezapasbizonpiluspapezcerenislamvorazbalonkonevodhadvorarbosonsuplepestosenatkoneclickovizummalermagielkanikunkaninjamiozagumakkorbaportofosnavyrazbleskranecletkaportahrnekstrupgenomhrnecfounakaselchlumudolihalernytekhousepuvoddosekkajakfrgalhoustbereczasahjimkasprezuhlirnozirbrblavyukapocitvrtakstejkastmausilibrcalprknopocinuhlikzbozivcelavikevdrinksenorpenzesepselesiklemursosnaamperpisektlupaturnekostecelermajorsynekvagonsnahamamutcenikholubtatarcvikrradloceledvesaksepotcelekpablbkrimiblanaroryscifraasramvegetsazkasatenatasemrzaktonusnormahoteltesartesakschodbasakobrnahledicepeljupkacepecbridzsatekmocalmoukactvrttridalytkozelendedickutilvanekkoalauchylzvastmytnekrcmatuhykbrachkanclhajekkrtekusvitchvattryskprvekvirusnezitvyronmodelsplavmlazivyroktorusflitrdzinysafirvalerorlojakrylcirokvyplnrifletukanfutroplsikotavaplechambitzumbacejkapametetikarandekleniudanimajakutlumpotahodvozpotacnarezrehektaxiksopelpotazcystapotasnarekchrommuldahukotvolekvolejchmelustuplejnoplemehrabechvojprdelharfarevmafenikkurvavlohanarysbulkagoudadlasksykottocnahlozipovykhoubaoddilmlsekloukaporadjoudabourekorekkorenpiratbudkaaspikpopudmodrotuzkahernanahacculikromankopiecyniksadarpevecsedlofenekunavastisktecnaslotapravovpichsakalperonkockavazbadudektemnopalkajichahelmasisalfuserskreksisakbrichskrecfiltrmaserfyzikslipyracekvycuccipsyhaldavrkocdurazmilirdohadmrdkazvuledryakduralvrzalkesonakantchybacentrhnidademonpetakanodazalarmelirdanekzumpaovacechasalijakrohaczubarmadlovyvojtacekgrantfrazetonfaklakavyvozfuriebastagrandestervejcejahlaestetselmaingotdeskybonusknourstacepuskatikettrmendeskarabindareksalvaditkozastirodicpnutivisenbutyluplavtrnozsumarpickasipkakolazpaterrynekcockaguanokolarkapsalezakkokosspajzkokotznenipatekkolacvrasacundrhavirkrachdilnaobtahtabakkeckalilienamelburicskalahltansetbavandrjasnotavbamordamykacprvokpouperetorpilkajadrobukacsluhataskachuzepasazsunardavkafagothobradonnavestadiskojipkapatkaslokazolikzavozfackaloudapinglzavojdohrazavodtrafokodexovsikeshopbosakveznysmetislastsedmabosazlelekdusnoovsirrajceplebsmungorijenbuzikhlistsantaplotrslamapadakvytkarafekdramapapucagavehasakjatralyskabezectrdlokvotavezirsaperjesenpodejfalusukrytrvaniparezdukatborekpapirzavalruckadukazzlunaharemterkafiletdrmekhyzdeusmevrvounserifhrmotselakdeltazvratserikvypadzlostsvenkmalirfrnakvyparspasavznetmalikzokejtahlokahanpugetkurkabelmosepiefrmolsitarholkablahonozkageckosifraneckyhyenazabrarytirkombikrvakjehneberylvranarubaspeckopeckarazicpomocrazieporcekulnadobehsutrazavsitubusgulagnorkaborkajamkagulasmixazpitvaenzymvreniceskohadacpenizhadakorbitceskaholenkarmadezensoupefarmastrehkalupkanalmosuskaluzvybojtotemstredkumstoktetvyborkanarordalstresmeltastrepjasotmorekbaroksosakbaroncurdatchanstavautlakfreonpazbaatlassuitarajdavojinpecetobjevzavitzdvizzazehvhledobjemmiskazdvihdynkolyzarhororajtakmagiknebytodpisodbertonazornatvylovvymazmenzazarezorisehonakrepkahranidcerahranablitiindexdutkafirmaantonvalekpolepvalecfunuszadekskoladutkymisenmiseklepraryteckadetkaderkontolapacvinarzaketzdaniryskakristroceklapakoltarponikdokarmetrovdovaoblekpohupdymkauzemiderbysalekucenipesakburanouskobrimeulitazlazalupekchlevohlaslupennametzizennamermotorpesarchlebcihalneladvycetvycepdoubinugethydrakundasvagrhumussnuravagusdrzkaostenhubkabrylelatkadojemzivelnapevvyverbudikostepbufetbudickrysaobletdusotlazenstychluxuspozarkuzelsalamsalaskozeldoliksojkacubkasekelzivecmoarezlobrzavrtzaceklinkajicenslovolavordulekvravatouhatumortalarkudlazlatobriarpalecfuskapatokkarasuchacpaniczlatynusekutiskmozolspanislivamaskahnutistrukvchodrobotzaberdobroskruzpietabatatbodakzabectlenibojkameterlanyzsperkmrkevsroubsmejdmapkatembrobrussrsenrubinhobbypixelobrucvyvinuklidmokropisarsrnkaratanudicesacekpakazlotosheslocidervynoscucekohavahnitidarcezanetslidarakoskotvalecbavodaknudlebananzidleopukachaosmenicseverrickamyskaburkasirakvasensiranjerabmysakhrudifranktempotretaklimahrbacgrazllalokstrdiryzakmusleroutamezekpahyllexemrafieletakdrkotkonakbabkakrytiemzakkoulehnedovyhraradekpranieidamstartherkavrsektuzbasalbasadlocuvaclumenbidonulicezaricledenuponaledekdopadtravafobienitrohavetargottokajgibonmuletargonlistizvedyelitatrznebotoxlistaubytedasenpoldapajkatrefalovecvzlyktrikokrutaspurtcimravezakbivakdosahtezarvykuphalasropotsufixmogulzaseksmrcipareklysectipecbetelrotorarestparkypraxekojottchorotiskshlukhvizdparkaekzemsinglzabehfonemtapirhazeckulikrigolbordochrpaxeroxodraztajnysedanlobbymedaksedakstuhaumeraosinahudbanavrhplevahnatafalesskunkonucebrzdabacilkurienoumaholictarifturekstaflempirhafanpaskarokleperlalulkazobaksycekneduhdacansasekbasenjehlaoskrtlibrabasetnoteschyseucivokrmicpianospicecachrtlachropakaferavjezdodtahpivkokvartpodilboricsilakzatahkvarkpodivsinushejnosneniorgantunelgymplsvatytopazkarkasvatasypkatucettunerhrochbulvamadalmadamarsenjizvakoreckibicmorcestetibahnofotkakejdabicikmuskaatikakakaovlhkoblatociskavyponebolaklopaemailblataavizovzdorbouraprozaovocelegievlnkakukuclaskazasypbiricvalbadatlevyspaaukcedzudonozikjizdaodenilyzolalkanlamackrasabronzrizekdehetvodicdenimdenikzbranvodiksprascirkaklejtsmichputnalymfaokolivyfukmafiekmotrnazkapolkazdrojdraniposuktraktfararkopakliskabedaratestpoterdrticzinekpotehnaterfazolhusarvickalaserdedekumorimacekvickochmyrpoustatakatrablhusakdomovvolicpannamazalsrankmazaksranidablemlsalmazacopruzprosomotivtenordebettahakpartahudecochozparteasantradkaslevacernooslikcipekcmouddietakabeldrinakoryskopecmudramudrcizmussaunasprejhekalpedalchlupsodikauditulevamisiealbinpolypzlobadinarzakysfetakaudioragbychramfenixnalozdekornemocskransiselsprymnanossextalinieiluzedipollupicvykonvzkazskrytrapiktrudaodnosrapirrezakcestapumpanickamitrarezacserummyckazahybjolkavedropirkocikanokrajmasivcedarpovozsoboltestorotnydojicporodboudacumaksklonosenizdobazajemlikerkodernavodzaletoporatlapazanikvaflesivensazbabystauzlabnakyphajzlnaborvatratroudhysekvykuknadordekansrustnabojserpahanbatuchapanevokleppsicedevcepulpapoetaerozebdenipastakredosrnecpanelvzporupletdudakandelperkotrnkarodeoovcingrupasumecskretzmijekamnaukrokjezekdotykbolidpolakukropsunkasockapoutacarkaodkoppoutolidarsumysmoherricinbutanvichrvolhastikavaricvyhonbranakrovimsicekalpamecikastramargozemakkartazemanzakazsilazmistrrumbarybarlimitdrbnamistokridalepekbedrakecupzebraepikapilaretapazrzkabalsatwistbloudzakerkorzobustazebronacekfolieposunterorcupotopicecteniodkapodkazhonbapsanisemisfluorvyvrtbytnakobravedmaloketzrzekmoudiklasakolejkoleklezecpilatpupikkaucerankatrimrzenitpacka';

/* modified fork */
function pickupRandomWord() {
    randomPick = Math.floor(Math.random() * allWords.length);
    for (i=0; i < allWords.length; i += 5) {
        if (randomPick <= i && randomPick >= i - 5) {
            return allWords.substring(i-5, i);
        }
    }
}

/*
Never used, because it is possible to clean the wordle game via
 */
function cleanInputsTable() {
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 5; j++) {
            let elementName = 'c'+i+j;
            gEl('c'+i+j).classList.remove('p-present');
            gEl('c'+i+j).classList.remove('p-absent');
            gEl('c'+i+j).innerHTML = '';
        }
    }
    let el = gEl('c00');
    el.classList.add('cursor');
}

async function insertWordIntoRowAndValidate(wordToInsert) {
    for (i = 0; i < 6; i++) {
        let firstColumnElem = gEl('c'+i+0);
        if(firstColumnElem.classList.contains("cursor")) {
            cRow = i;
            for (j = 0; j < 5; j++) {
                addLetter(wordToInsert[j]);
            }
            validateRow();
            break;
        }

    }
}

/*
    Websocket message JSON spec
    {
        "state":"init", // possible options: init, pattern
        "content":"01100" // content if pattern
    }
 */

function composeWSMessage(state, content) {
    return "{\"state\":\"" + state + "\",\"content\":\"" + content + "\"}"
}

function sendViaWebsocket(state, content) {
    return new Promise((resolve, reject) => {
        let socket = new WebSocket("ws://localhost:9999");
        socket.onopen = function(e) {
          console.info("WSS connection established.");
          console.log("Sending data to server.");
          socket.send(composeWSMessage(state, content));
          waitForAnswer = true;
          reject("Opened");
        };

        socket.onmessage = function (event) {
            console.log(`[message] Data received from server: ${event.data}`);
            insertWordIntoRowAndValidate(event.data);
            console.log(board);
            console.log(localStorage.getItem('wordle.score'));
            console.log(wordPattern);
            waitForAnswer = true;
            reject("data sent");
        };

        socket.onclose = function(event) {
          if (event.wasClean) {
            // alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            resolve("Success");
            waitForAnswer = false;
          } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            // alert('[close] Connection died');
            console.log("[close] Connection died");
            waitForAnswer = false;
            reject("Error!");
          }
        };

        socket.onerror = function(error) {
          // alert(`[error] ${error.message}`);
          console.log(`[error] ${error.message}`);
          waitForAnswer = false;
          reject("Error!");
        };
    });

}


