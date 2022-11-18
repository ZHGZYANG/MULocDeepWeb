import numpy as np
import os
import argparse
import sys

def readData(att_weight_file,seq_file,lv1_pred_file):
    dic_id2att={}
    dic_id2seq={}
    dic_id2pred={}
    with open(att_weight_file, 'r') as f_att_weight:
        for eachline in f_att_weight:
            eachline=eachline.strip()
            if eachline[0]==">":
                id=eachline[1:]
            else:
                att=eachline[0:]
                dic_id2att[id]=att
    with open(seq_file, 'r') as f_seq:
        for eachline in f_seq:
            eachline=eachline.strip()
            if eachline[0]==">":
                id=eachline[1:]
            else:
                seq=eachline[0:]
                dic_id2seq[id]=seq
    with open(lv1_pred_file, 'r') as f_pred:
        for eachline in f_pred:
            eachline=eachline.strip()
            tab_sep=eachline.split("\t")
            id=tab_sep[0][1:-1]
            pred=tab_sep[-1].split(":")[1]
            dic_id2pred[id] = pred
    return [dic_id2att,dic_id2pred,dic_id2seq]



def get_amino_acid(index):
    return list(letterDict.keys())[list(letterDict.values()).index(index)]


letterDict = {}
letterDict["A"] = 0
letterDict["C"] = 1
letterDict["D"] = 2
letterDict["E"] = 3
letterDict["F"] = 4
letterDict["G"] = 5
letterDict["H"] = 6
letterDict["I"] = 7
letterDict["K"] = 8
letterDict["L"] = 9
letterDict["M"] = 10
letterDict["N"] = 11
letterDict["P"] = 12
letterDict["Q"] = 13
letterDict["R"] = 14
letterDict["S"] = 15
letterDict["T"] = 16
letterDict["V"] = 17
letterDict["W"] = 18
letterDict["Y"] = 19


def extractPWM4Loc(id_list,dic_id2att,dic_id2seq,dir,dis=50):
    PWM_n = np.zeros([20, dis])
    PWM_c = np.zeros([20, dis])
    for i in id_list:
        seq_n = dic_id2seq[i][0:dis]
        seq_c = dic_id2seq[i][-1:-dis - 1:-1]
        index = 0
        for s in seq_n:
            if s in letterDict:
                PWM_n[letterDict[s], index] += 1
                index += 1
        index = 0
        for s in seq_c:
            if s in letterDict:
                PWM_c[letterDict[s], index] += 1
                index += 1
    wn = np.zeros([dis, len(id_list)])
    wc = np.zeros([dis, len(id_list)])
    ind=0
    for i in id_list:
        att_n = dic_id2att[i].split()[0:dis]
        att_c = dic_id2att[i].split()[-1:-dis - 1:-1]
        # print(att_n)
        # print(att_c)
        for j in range(dis):
            wn[j,ind]=float(att_n[j])
            wc[j, ind] = float(att_c[j])
        ind+=1
    attweights_n = wn.sum(axis=1) / len(id_list)
    attweights_c = wc.sum(axis=1) / len(id_list)
    weighted_PWM_n = np.zeros([20, dis])
    for i in range(dis):
        for j in range(20):
            weighted_PWM_n[j, i] = PWM_n[j, i] / PWM_n[:, i].sum() * float(attweights_n[i])
    weighted_PWM_c = np.zeros([20, dis])
    for i in range(dis):
        for j in range(20):
            weighted_PWM_c[j, i] = PWM_c[j, i] / PWM_c[:, i].sum() * float(attweights_c[i])
    output = open(dir + "/N_terminal_" + str(dis), 'w')
    for i in range(weighted_PWM_n.shape[0]):
        output.write(get_amino_acid(i) + "\t");
        output.write("\t".join([str(x) for x in weighted_PWM_n[i]]) + "\n")
    output.close()
    output = open(dir + "/C_terminal_" + str(dis), 'w')
    for i in range(weighted_PWM_c.shape[0]):
        output.write(get_amino_acid(i) + "\t");
        output.write("\t".join([str(x) for x in weighted_PWM_c[i]]) + "\n")
    output.close()

def extractAttRatio(id_list, dic_id2att,path,randN,randC,dis=50):
    N = []
    C = []
    tem = []
    for i in id_list:
        att_n = dic_id2att[i].split()[0:dis]
        for j in att_n:
            tem.append(float(j))
            N.append(tem)
        tem = []
        att_c = dic_id2att[i].split()[-dis:]
        for j in att_c:
            tem.append(float(j))
            C.append(tem)
        tem=[]
    Narray = np.array(N)
    Carray = np.array(C)
    Nave = np.mean(Narray, axis=0)
    Cave = np.mean(Carray, axis=0)
    ratioN=Nave/randN
    ratioC=Cave/randC
    f = open(path+"/ratioN", "w")
    for i in ratioN:
        f.write(str(i) + "\n")
    f.close()
    f = open(path+"/ratioC", "w")
    for i in ratioC:
        f.write(str(i) + "\n")
    f.close()


def loopLoc(dic_id2pred,dir,dic_id2att, dic_id2seq,dis):
    name = ["Nucleus", "Cytoplasm", "Secreted", "Mitochondrion", "Membrane", "Endoplasmic", "Plastid",
            "Golgi_apparatus", "Lysosome", "Peroxisome"]
    randN=[]
    randC=[]
    # upperdir="/".join(dir.split("/")[:-2])+"/"
    randomdir='./random/'
    with open(randomdir+"random_N50") as fp:
        for line in fp:
            randN.append(float(line.strip()))
    with open(randomdir+"random_C50") as fp:
        for line in fp:
            randC.append(float(line.strip()))
    rN=np.array(randN)
    rC=np.array(randC)
    for n in name:
        tem_id_list = []
        path = os.path.join(dir, n)
        if not os.path.exists(path):
            os.mkdir(path)
        for i in dic_id2pred.keys():
            loc=dic_id2pred[i]
            l=len(dic_id2seq[i])
            if l<dis:
                continue
            if n in loc:
                tem_id_list.append(i)
        if len(tem_id_list)>=10:
            print(n)
            print(path)
            extractPWM4Loc(tem_id_list, dic_id2att, dic_id2seq,path,dis)
            extractAttRatio(tem_id_list, dic_id2att, path, rN, rC, dis)


def draw_attPlots(jobdir, attfile, seqfile, predfile):
    if not jobdir[len(jobdir) - 1] == "/":
        jobdir = jobdir + "/"
    [dic_id2att, dic_id2pred, dic_id2seq] = readData(jobdir+attfile, seqfile, jobdir+predfile)
    loopLoc(dic_id2pred, jobdir, dic_id2att, dic_id2seq, 50)
    os.system('Rscript ggseqlog.R ' + jobdir)


