myArgs <- commandArgs(trailingOnly = TRUE)
dir=myArgs[1]
loc=c("Nucleus", "Cytoplasm", "Secreted", "Mitochondrion", "Membrane", "Endoplasmic", "Plastid",
            "Golgi_apparatus", "Lysosome", "Peroxisome")
#dir="/home/yuexu/localization_clean/reduce_plastid/"
library(ggseqlogo)
library(ggplot2)
#######N########
for (l in loc)
{
    filename=paste(dir,l,"/N_terminal_50",sep="")
    if(file.exists(filename))
    {
        seq=read.table(filename)
        row.names(seq)=seq[,1]
        seq=seq[,-1]
        seq=as.matrix(seq)
        png(paste(dir,l,"/N_terminal_50.png",sep=""))
        plt=ggseqlogo(seq, method='custom', seq_type='aa') +
            ylim(0,0.03)+
            scale_x_continuous(breaks = seq(0, 50, by = 10),limits=c(0,50))+
            ylab('att')+
            theme(axis.text.y = element_text(size=20),
              axis.text.x = element_text(size=20))
        #ggtitle("Cytoplasm")

        print(plt)
        dev.off()
    }

}


#########C############
for (l in loc)
{
    filename=paste(dir,l,"/C_terminal_50",sep="")
    if(file.exists(filename))
    {
        seq=read.table(filename)
        row.names(seq)=seq[,1]
        seq=seq[,c(51:2)]
        seq=as.matrix(seq)
        png(paste(dir,l,"/C_terminal_50.png",sep=""))
        plt=ggseqlogo(seq, method='custom', seq_type='aa') +
            ylim(0,0.03)+
            ylab('att')+
            scale_x_continuous(breaks = seq(0, 50, by = 5))+
            theme(axis.text.y = element_text(size=20), axis.text.x = element_text(size=20))

        print(plt)
        dev.off()

    }

}
############################ ratio
for (l in loc)
{
    filename=paste(dir,l,"/ratioN",sep="")
    if(file.exists(filename))
    {
        seq=read.table(filename)
        png(paste(dir,l,"/N_ratio_50.png",sep=""))
        plt=plot(c(1:50),seq$V1,"l",cex.axis=2,col="black",ylim = c(0,2),lwd=2, ylab="attention weight ratio",xlab="")
        plt=lines(c(1:50),rep(1,50),"l",cex.axis=2,col="red",lwd=2)
        print(plt)
        dev.off()
    }
    filename=paste(dir,l,"/ratioC",sep="")
    if(file.exists(filename))
    {
        seq=read.table(filename)
        png(paste(dir,l,"/C_ratio_50.png",sep=""))
        plt=plot(c(1:50),seq$V1,"l",cex.axis=2,col="black",ylim = c(0,2),lwd=2, ylab="attention weight ratio",xlab="")
        plt=lines(c(1:50),rep(1,50),"l",cex.axis=2,col="red",lwd=2)
        print(plt)
        dev.off()
    }
}




