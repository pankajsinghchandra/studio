'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingOverlay from '@/components/loading-overlay';

const syllabus = {
    "3": {
        "Mathematics": ["ज्यामिति", "संख्याएँ", "जोड़-घटाव", "गुणा", "भाग", "भिन्न संख्याएँ", "मुद्रा", "लम्बाई", "भार", "धारिता", "समय", "पैटर्न", "आँकड़ों का चित्रात्मक निरूपण"],
        "Environmental Studies": ["चाचा की शादी", "हमारा परिवार", "जीव-जन्तुओं की दुनिया", "रंग-बिरंगे पंख", "पेड़-पौधों से दोस्ती", "पत्ता हूँ मैं हरा-हरा", "तरह-तरह के भोजन", "कुछ कच्चा कुछ पका हुआ", "पकायेंगे-खायेंगे", "घर को जानें", "दीपावली की तैयारी", "किस ओर क्या", "स्कूल के आस-पास", "पानी", "दानापुर से गौरा तक", "चिट्ठी का सफर", "कपड़े तरह-तरह के", "तेरी-मेरी उछलकूद", "कोशिश करके देख ले", "आओ खेलें मिट्टी से"],
        "Hindi": ["प्रार्थना", "प्रतीक्षा", "मेरा गाँव", "बब्बन बंदर", "खूब मजे हैं मौसम के", "जंगल में सभा", "फुलवारी", "रक्षाबंधन", "तिरंगा", "कौवा और साँप", "उल्टा-पुल्टा", "गाँधीजी की कहानी-चित्रों की जुबानी", "राजगीर", "दीप जले", "साहसी इंदिरा", "गंगा नदी", "बैलगाड़ी का दाम", "हम सब", "कुत्ते की कहानी", "खेल-खेल में"],
        "English": ["THIS IS THE WAY", "MURLI’S MANGO TREE", "ONE LITTLE KITTEN", "WHO’S AFRAID OF THE CAT ?", "THE OLD RABBIT", "UPSIDE DOWN", "THE TIGER AND THE MOSQUITO", "KITH-KITH", "CATS", "I CAN DANCE", "UNITY IS STRENGTH", "A PICNIC", "MICE", "NOW THE ROAD WILL BE FINE", "THE PHONE CALL", "MUNIA GOES TO SCHOOL", "GONU AND BHONU"]
    },
    "4": {
        "Mathematics": ["संख्याओं का मेला", "जोड़", "घटाव", "गुणा", "भाग", "मुद्रा", "भिन्नात्मक संख्याएँ", "सममिति", "लम्बाई की माप", "भार", "धारिता", "समय", "टाइलीकरण", "परिमाप एवं क्षेत्रफल", "आँकड़ों का खेल", "आकृतियाँ", "पैटर्न"],
        "Environmental Studies": ["रंग-बिरंगे खिलते फूल", "कोई देता अंडे, कोई देता बच्चे", "हड़बड़ में गड़बड़", "त्योहार और भोजन", "स्वाद अलग-अलग", "हरियाली और हम", "जड़ों की पकड़", "देख तमाशा", "जब मामाजी घर आए", "छठ पर्व और बच्चे", "आओ बनाएँ नक्शा", "अपना प्यारा घर", "खेत से घर तक", "बालमेला और खेल", "आस-पास की सफाई", "मीठा-मीठा शहद", "तरह-तरह के पक्षी", "जंगल में पिकनिक", "ककोलत से कन्याकुमारी", "हमारे मददगार-कामगार", "तरह-तरह के घर", "अजय जब गाँव लौटे", "आस-पास की खोज खबर", "चिड़ियाघर की सैर", "बंटी का सफर"],
        "Hindi": ["याद तुम्हारी आती है", "चार मित्र", "घर प्यारा", "बिल्ली का पंजा", "घाघ भड्डरी", "सेर को सवा सेर", "सीखो", "सुनीता की पहिया कुर्सी", "हमारा आहार", "तीन बुद्धिमान", "टेसू राजा", "ऐसे थे बापू", "चाचा का पत्र", "बिजूका", "शूलपाणि", "साहसी ऋचा", "बल्ब", "बौना हुआ पहाड़", "सुबह", "पत्तियों का चिड़ियाघर", "बरगद का पेड़"],
        "English": ["I LOVE GRANDMA", "OUR HOME", "VIKRAM, THE WISE KING", "LET ME DIAL", "HEERA AND MOTI", "THE BOY WHO CRIED WOLF", "THE QUARREL", "OUR NATIONAL FLAG", "OUR FESTIVALS", "WORK WILL BRING ITS OWN REWARDS", "ASSERTING VOICE", "FROM AN ILLITERATE VILLAGE GIRL TO A TEACHER", "THE LITTLE RED HEN", "HE LEAVES THE NEST", "COMPUTER", "DIRT AND FLIES", "THE MILKMAN'S COW", "OPEN HOUSE"]
    },
    "5": {
        "English": ["Nobody's Friend", "The Smell of Bread and the Sound of Money", "The House Sparrow", "Day by Day I Float My Paper Boats", "An Act of Bravery", "The Old Man and His Grandson", "Lovely Moon", "The Arab and His Camel", "Birbal's Wit", "The Ant and the Grasshopper", "My Miracle Mother", "Jesus to Supper", "Day Dream", "Three Little Pigs", "The Blind Beggar", "The Crow", "The Crocodile's Advice", "Sengai Blesses a Family", "Wonderful Waste", "The Wonder Cot"],
        "Hindi": ["हिंद देश के निवासी", "टिपटिपवा", "हुआ यूँ कि …..", "चाँद का कुरता", "म्यान का रंग", "उपकार का बदला", "चतुर चित्रकार", "ननकू", "ममता की मूर्ति", "आया बादल", "एक पत्र की आत्मकथा", "कविता का कमाल", "कदंब का पेड़", "दोहे", "चिट्ठी आई है", "मरती क्यों न करती", "बिना जड़ का पेड़", "आज़ादी में जीवन", "अँधेर नगरी", "क्यों", "ईद", "परीक्षा", "मिथिला चित्रकला"],
        "Environmental Studies": ["पटना से नाशुला की यात्रा", "खेल", "बीजों का बिखरना", "मेरा बगीचा", "ऐतिहासिक स्मारक", "सिंचाई के साधन", "जितना खाओ उतना पकाओ", "रॉस की जंग : मच्छरों के संग", "मैंने नक्शा बनाया", "हमारी फसलें : हमारा खान-पान", "जंतु जगत : सुरक्षा और संरक्षण", "मान गए लोहा", "प्राणी और हम", "सूरज एक काम अनेक", "हमारा जंगल", "चलो सर्वे करें", "रामू काका की दुकान", "आवास", "तरह-तरह के व्यवसाय", "रायपुर वाले चाचा की शादी", "लकी जब बीमार पड़ा"],
        "Mathematics": ["संख्याओं का मेला", "जोड़-घटाव", "गुणा-भाग", "गुणज तथा गुणनखण्ड", "भिन्न एवं दशमलव भिन्न", "मुद्रा एवं बैंकिंग", "कोण", "सममिति", "आकृतियाँ", "मापन की इकाइयाँ", "परिमाप एवं क्षेत्रफल", "आयतन", "समय", "आँकड़ों का खेल", "पैटर्न"]
    },
    "6": {
        "English": ["A Bottle of Dew", "The Raven and the Fox", "Rama to the Rescue", "The Unlikely Best Friends", "A Friend's Prayer", "The Chair", "Neem Baba", "What a Bird Thought", "Spices that Heal Us", "Change of Heart", "The Winner", "Yoga—A Way of Life", "Hamara Bharat—Incredible India!", "The Kites", "Ila Sachani: Embroidering Dreams with her Feet", "National War Memorial", "A Tale of Two Birds", "The Friendly Mongoose", "The Shepherd's Treasure", "Tansen", "The Monkey and the Crocodile", "The Wonder Called Sleep", "A Pact with the Sun"],
        "Hindi": ["मातृभूमि", "गोल", "पहली बूँद", "हार की जीत", "रहीम के दोहे", "मेरी माँ", "जलाते चलो", "सत्रिया और बिहू नृत्य", "मैया मैं नहिं माखन खायो", "परीक्षा", "चेतक की वीरता", "हिंद महासागर में छोटा-सा हिंदुस्तान", "पेड़ की बात", "कलम", "किताब", "घर", "पतंग", "भालू", "झरना", "धनुष", "रूमाल", "कक्षा", "गुब्बारा", "पर्वत", "हमारा घर", "कपड़े की दुकान में", "फूल", "बातचीत", "शिलांग से फोन", "तितली", "ईश्वरचंद्र विद्यासागर"],
        "Science": ["विज्ञान का अनूठा संसार", "सजीव जगत में विविधता", "उचित आहार स्वस्थ शरीर का आधार", "चुंबकों को जानें", "लंबाई एवं गति का मापन", "हमारे आस-पास की सामग्री", "ताप एवं उसका मापन", "जल की विविध अवस्थाओं की यात्रा", "दैनिक जीवन में पृथक्करण विधियाँ", "सजीव—विशेषताओं का अन्वेषण", "प्रकृति की अमूल्य संपदा", "पृथ्वी से परे"],
        "Social Science": ["पृथ्वी पर स्थानों की स्थिति", "महासागर एवं महाद्वीप", "स्थलरूप एवं जीवन", "इतिहास की समय-रेखा एवं उसके स्रोत", "इंडिया, अर्थात् भारत", "भारतीय सभ्यता का प्रारंभ", "भारत की सांस्कृतिक जड़ें", "विविधता में एकता या ‘एक में अनेक’", "परिवार और समुदाय", "आधारभूत लोकतंत्र – भाग 1: शासन", "आधारभूत लोकतंत्र – भाग 2: ग्रामीण क्षेत्रों में स्थानीय सरकार", "आधारभूत लोकतंत्र – भाग 3: नगरीय क्षेत्रों में स्थानीय सरकार", "कार्य का महत्व", "हमारे आस-पास की आर्थिक गतिविधि", "बिहार के संदर्भ में विशिष्ट जानकारी"],
        "Computer": ["कंप्यूटर: एक परिचय", "कंप्यूटर के अंग", "आओ कंप्यूटर चलाएं", "आओ चित्रकारी करें", "माइक्रोसॉफ्ट वर्ड", "सूचना एवं संचार प्रौद्योगिकी का अनुप्रयोग", "डिजिटल नागरिकता और साइबर सुरक्षा", "आई. सी. टी. के उभरते रुझान"],
        "Sanskrit": ["वयं वर्णमालां पठामः", "एषः कः ? एषा का ? एतत् किम्?", "अहं च त्वं च", "अहं प्रातः उत्तिष्ठामि", "शूराः वयं धीराः वयम्", "सः एव महान् चित्रकारः", "अतिथिदेवो भव", "बुद्धिः सर्वार्थसाधिका", "यो जानाति सः पण्डितः", "त्वम् आपणं गच्छ", "पृथिव्यां त्रीणि रत्नानि", "आलस्यं हि मनुष्याणां शरीरस्थो महान् रिपुः", "सङ्ख्यागणना ननु सरला", "माधवस्य प्रियम् अङ्गम्", "वृक्षाः सत्पुरूषाः इव"]
    },
    "7": {
        "English": ["Three Questions", "The Squirrel", "A gift of Chappals", "The Rebel", "Gopal and the Hilsa Fish", "The Shed", "The Ashes That Made Trees Bloom", "Chivvy", "Quality", "Trees", "Expert Detectives", "Mystery of the Talking Fan", "The Invention of Vita-Wonk", "Dad and the Cat and the Tree", "Garden Snake", "A Homage to our Brave Soldiers", "Meadow Surprises", "The Tiny Teacher", "Bringing up Kari", "Golu Grows a Nose", "Chandni", "The Bear Story", "A tiger in the house", "An Alien Hand"],
        "Hindi": ["हम पंछी उन्मुक्त गगन के", "हिमालय की बेटियाँ", "कठपुतली", "मिठाईवाला", "पापा खो गए", "शाम-एक किसान", "अपूर्व अनुभव", "रहीम के दोहे", "एक तिनका", "खानपान की बदलती तसवीर", "नीलकंठ", "भोर और बरखा", "वीर कुँवर सिंह", "संघर्ष के कारण मैं तुनुकमिजाज हो गया", "धनराज", "आश्रम का अनुमानित व्यय", "चिड़िया और चुरुंगुन", "सबसे सुंदर लड़की", "मैं हूँ रोबोट", "गुब्बारे पर चीता", "थोड़ी धरती पाऊँ", "गारो", "पुस्तकें जो अमर हैं", "काबुलीवाला", "विश्वेश्वरैया", "हम धरती के लाल", "पोंगल", "शहीद झलकारी बाई", "नृत्यांगना सुधा चंद्रन", "पानी और धूप", "गीत", "मिट्टी की मूर्तियाँ", "मौत का पहाड़", "हम होंगे कामयाब"],
        "Science": ["पादपों में पोषण", "प्राणियों में पोषण", "ऊष्मा", "अम्ल, क्षारक और लवण", "भौतिक एवं रासायनिक परिवर्तन", "जीवों में श्वसन", "जंतुओं और पादप में परिवहन", "पादप में जनन", "गति एवं समय", "विद्युत धारा और इसके प्रभाव", "प्रकाश", "वन : हमारी जीवन रेखा", "अपशिष्ट जल की कहानी"],
        "Social Science": ["प्रारंभिक कथन : हजार वर्षों के दौरान हुए परिवर्तनों की पड़ताल", "राजा और उनके राज्य", "दिल्ली : बारहवीं से पंद्रहवीं शताब्दी", "मुगल : सोलहवीं से सत्रहवीं शताब्दी", "जनजातियाँ, खानाबदोश और एक जगह बसे हुए समुदाय", "ईश्वर से अनुराग", "क्षेत्रीय संस्कृतियों का निर्माण", "अठारहवीं शताब्दी में नए राजनीतिक गठन", "बिहार के संदर्भ में विशेष जानकारी", "पर्यावरण", "हमारी पृथ्वी के अंदर", "हमारी बदलती पृथ्वी", "वायु", "जल", "मानव-पर्यावरण अन्योन्यक्रिया: उष्णकटिबंधीय एवं उपोष्ण प्रदेश", "रेगिस्तान में जीवन", "समानता", "स्वास्थ्य में सरकार की भूमिका", "राज्य शासन कैसे काम करता है", "लड़के और लड़कियों के रूप में बड़ा होना", "औरतों ने बदली दुनिया", "संचार माध्यमों को समझना", "हमारे आस-पास के बाजार", "बाज़ार में एक कमीज", "सड़क सुरक्षा उपाय"],
        "Sanskrit": ["सुभाषितानि", "दुर्बुद्धिः विनश्यति", "स्वावलम्बनम्", "पण्डिता रमाबाई", "सदाचारः", "सङ्कल्पः सिद्धिदायकः", "त्रिवर्णः ध्वजः", "अहमपि विद्यालयं गमिष्यामि", "विश्वबन्धुत्वम्", "समवायो हि दुर्जयः", "विद्याधनम्", "अमृतं संस्कृतम्", "लालनगीतम्"]
    },
    "8": {
        "English": ["The Best Christmas Present in the World", "The Tsunami", "Glimpses of the Past", "Bepin Choudhury's Lapse of Memory", "The Summit Within", "This is Jody’s Fawn", "A Visit to Cambridge", "A Short Monsoon Diary", "How the camel got his hump", "Children at work", "The Selfish Giant", "The treasure within", "Princess September", "The fight", "Jalebis", "Ancient Education System of India"],
        "Hindi": ["लाख की चूड़ियाँ", "बस की यात्रा", "दीवानों की हस्ती", "भगवान के डाकिए", "क्या निराश हुआ जाए", "यह सबसे कठिन समय नहीं", "कबीर की साखियाँ", "सुदामा चरित", "जहाँ पहिया है", "अकबरी लोटा", "सूरदास के पद", "पानी की कहानी", "बाज और साँप", "गुड़िया", "दो गौरैया", "चिट्ठियों में यूरोप", "ओस", "नाटक में नाटक", "सागर यात्रा", "उठ किसान ओ", "सस्ते का चक्कर", "एक खिलाड़ी की कुछ यादें", "बस की सैर", "हिंदी ने जिनकी जिंदगी बदल दी मारिया नेज्यैशी", "आषाढ़ का पहला दिन", "अन्याय के खिलाफ", "बच्चों के प्रिय श्री केशव शंकर पिल्लै", "फर्श पर", "बूढ़ी अम्मा की बात", "वह सुबह कभी तो आएगी", "आओ पत्रिका निकालें", "आह्वान"],
        "Science": ["फसल उत्पादन एवं प्रबंध", "सूक्ष्मजीव: मित्र एवं शत्रु", "कोयला और पेट्रोलियम", "दहन एवं ज्वाला", "पौधे एवं जंतुओं का संरक्षण", "जंतुओं में जनन", "किशोरावस्था की ओर", "बल तथा दाब", "घर्षण", "ध्वनि", "विद्युत धारा के रासायनिक प्रभाव", "कुछ प्राकृतिक परिघटनाएँ", "प्रकाश"],
        "Social Science": ["प्रारंभिक कथन: कैसे, कब और कहाँ", "व्यापार से साम्राज्य तक कंपनी की सत्ता स्थापित होती है", "ग्रामीण क्षेत्र पर शासन चलाना", "आदिवासी, दीकु और एक स्वर्ण युग की कल्पना", "जब जनता बगावत करती है 1857 और उसके बाद", "“देशी जनता” को सभ्य बनाना राष्ट्र को शिक्षित करना", "महिलाएँ, जाति एवं सुधार", "राष्ट्रीय आंदोलन का संघटन: 1870 के दशक से 1947 तक", "बिहार के संदर्भ में विशेष जानकारी", "संसाधन", "भूमि, मृदा, जल, प्राकृतिक वनस्पति और वन्य जीवन संसाधन", "कृषि", "उद्योग", "मानव संसाधन", "पुनरावृत्ति", "भारतीय संविधान", "धर्मनिरपेक्षता की समझ", "संसद तथा कानूनों का निर्माण", "न्यायपालिका", "हाशियाकरण की समझ", "हाशियाकरण से निपटना", "जनसुविधाएँ", "कानून और सामाजिक न्याय"],
        "Sanskrit": ["सुभाषितानि", "बिलस्य वाणी न कदापि मे श्रुता", "डिजीभारतम्", "सदैव पुरतो निधेहि चरणम्", "कण्टकेनैव कण्टकम्", "गृहं शून्यं सुतां विना", "भारतजनताऽहम्", "संसारसागरस्य नायकाः", "सप्तभगिन्यः", "नीतिनवनीतम्", "सावित्री बाई फुले", "कः रक्षति कः रक्षितः", "क्षितौ राजते भारतस्वर्णभूमिः", "आर्यभटः"]
    }
};

export default function ManageContentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [resourceClass, setResourceClass] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [type, setType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const subjects = useMemo(() => {
    return resourceClass ? Object.keys(syllabus[resourceClass as keyof typeof syllabus] || {}) : [];
  }, [resourceClass]);

  const chapters = useMemo(() => {
    if (resourceClass && subject) {
      const classSyllabus = syllabus[resourceClass as keyof typeof syllabus];
      return classSyllabus ? classSyllabus[subject as keyof typeof classSyllabus] || [] : [];
    }
    return [];
  }, [resourceClass, subject]);


  useEffect(() => {
      if (!loading && (!user || user.email !== 'quizpankaj@gmail.com')) {
        router.replace('/');
      }
  }, [user, loading, router]);


  if (loading || !user) {
    return <LoadingOverlay isLoading={true} />;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !resourceClass || !subject || !chapter || !type) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please fill out all required fields.',
        });
        return;
    }
    setIsUploading(true);

    try {
      let resourceUrl = '';

      if (type === 'video') {
        resourceUrl = videoLink;
      } else if (file) {
        const storage = getStorage();
        const fileId = uuidv4();
        const storageRef = ref(storage, `resources/${fileId}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        resourceUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'resources'), {
        title,
        class: resourceClass,
        subject,
        chapter,
        type,
        url: resourceUrl,
        authorId: user.uid,
        createdAt: new Date(),
      });

      toast({
        title: 'Success!',
        description: 'Resource has been added successfully.',
      });
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: (error as Error).message || 'There was a problem with your request.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LoadingOverlay isLoading={isUploading} />
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Add New Content</CardTitle>
            <CardDescription>Fill in the details to upload a new resource.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g., Introduction to Algebra" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select onValueChange={value => { setResourceClass(value); setSubject(''); setChapter(''); }} required value={resourceClass}>
                        <SelectTrigger id="class"><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(syllabus).map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={value => { setSubject(value); setChapter(''); }} required value={subject} disabled={!resourceClass}>
                        <SelectTrigger id="subject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter</Label>
                    <Select onValueChange={setChapter} required value={chapter} disabled={!subject}>
                        <SelectTrigger id="chapter"><SelectValue placeholder="Select Chapter" /></SelectTrigger>
                        <SelectContent>
                            {chapters.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select onValueChange={setType} required value={type}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson-plan-pdf">Lesson Plan (PDF)</SelectItem>
                  <SelectItem value="lesson-plan-word">Lesson Plan (Word)</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="infographic">Infographic (Image)</SelectItem>
                  <SelectItem value="mind-map">Mind Map (Image)</SelectItem>
                  <SelectItem value="pdf-note">PDF Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === 'video' ? (
              <div className="space-y-2">
                <Label htmlFor="videoLink">Video Link</Label>
                <Input id="videoLink" type="url" placeholder="https://www.youtube.com/watch?v=..." required value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
              </div>
            ) : (
              type && (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File</Label>
                  <Input id="file" type="file" required onChange={handleFileChange} />
                </div>
              )
            )}
            <Button className="w-full" type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Add Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
